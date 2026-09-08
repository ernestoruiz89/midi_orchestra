const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns').promises;
const net = require('node:net');
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { Transform, pipeline } = require('node:stream');
const { promisify } = require('node:util');

const streamPipeline = promisify(pipeline);
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const cacheDir = process.env.CACHE_DIR || '/var/cache/midi-orchestra-proxy';
const maxBytes = 10 * 1024 * 1024;
const maxUrlLength = 2048;
const cacheLifetimeMs = 24 * 60 * 60 * 1000;
const requestTimeoutMs = 15 * 1000;
const inflight = new Map();

function isPublicIpv4(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || b === 168)) return false;
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return false;
  if (a === 203 && b === 0) return false;
  return true;
}

function isPublicAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family !== 6) return false;

  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) return isPublicIpv4(normalized.slice(7));
  // Public IPv6 is globally routable in 2000::/3. Reject loopback, local,
  // link-local, multicast and documentation ranges by allowing only this range.
  const firstNibble = normalized[0];
  return firstNibble === '2' || firstNibble === '3';
}

async function resolvePublicHost(hostname) {
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  const publicAddress = addresses.find(({ address }) => isPublicAddress(address));
  if (!publicAddress) throw new Error('The URL resolves only to private or reserved network addresses.');
  return publicAddress;
}

async function getRemoteResponse(url, redirectsRemaining = 3) {
  const address = await resolvePublicHost(url.hostname);
  const transport = url.protocol === 'https:' ? https : http;
  const options = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || undefined,
    path: `${url.pathname}${url.search}`,
    method: 'GET',
    headers: {
      'User-Agent': 'MIDI-Orchestra-Proxy/1.0',
      'Accept': 'audio/midi,audio/sp-midi,application/octet-stream;q=0.9,*/*;q=0.1'
    },
    servername: url.hostname,
    lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
    timeout: requestTimeoutMs
  };

  return new Promise((resolve, reject) => {
    const request = transport.request(options, async response => {
      const redirectStatus = [301, 302, 303, 307, 308].includes(response.statusCode);
      if (redirectStatus && response.headers.location) {
        response.resume();
        if (redirectsRemaining <= 0) return reject(new Error('Too many redirects.'));
        try {
          resolve(await getRemoteResponse(new URL(response.headers.location, url), redirectsRemaining - 1));
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        return reject(new Error(`Remote server returned HTTP ${response.statusCode}.`));
      }
      const contentLength = Number(response.headers['content-length'] || 0);
      if (contentLength > maxBytes) {
        response.resume();
        return reject(new Error('The MIDI file exceeds the 10 MB limit.'));
      }
      resolve(response);
    });
    request.on('timeout', () => request.destroy(new Error('Remote MIDI request timed out.')));
    request.on('error', reject);
    request.end();
  });
}

function cachePaths(url) {
  const key = crypto.createHash('sha256').update(url).digest('hex');
  return {
    midi: path.join(cacheDir, `${key}.mid`),
    metadata: path.join(cacheDir, `${key}.json`)
  };
}

async function getCachedEntry(url) {
  const paths = cachePaths(url);
  try {
    const metadata = JSON.parse(await fsp.readFile(paths.metadata, 'utf8'));
    const stat = await fsp.stat(paths.midi);
    if (metadata.url === url && metadata.expiresAt > Date.now() && stat.size > 4 && stat.size <= maxBytes) {
      return paths;
    }
  } catch (_) {
    // A cache miss is expected for a new URL or an expired entry.
  }
  await Promise.allSettled([fsp.unlink(paths.midi), fsp.unlink(paths.metadata)]);
  return null;
}

async function downloadToCache(url) {
  const existing = await getCachedEntry(url);
  if (existing) return existing;

  const paths = cachePaths(url);
  const temporaryFile = `${paths.midi}.${process.pid}.${crypto.randomUUID()}.part`;
  let received = 0;
  let signature = Buffer.alloc(0);
  try {
    const response = await getRemoteResponse(new URL(url));
    const guard = new Transform({
      transform(chunk, _encoding, callback) {
        received += chunk.length;
        if (received > maxBytes) return callback(new Error('The MIDI file exceeds the 10 MB limit.'));
        if (signature.length < 4) signature = Buffer.concat([signature, chunk]).subarray(0, 4);
        callback(null, chunk);
      }
    });
    await streamPipeline(response, guard, fs.createWriteStream(temporaryFile, { flags: 'wx', mode: 0o640 }));
    if (signature.toString('ascii') !== 'MThd') throw new Error('The downloaded file is not a Standard MIDI or Karaoke file.');

    await fsp.rename(temporaryFile, paths.midi);
    await fsp.writeFile(paths.metadata, JSON.stringify({
      url,
      createdAt: Date.now(),
      expiresAt: Date.now() + cacheLifetimeMs
    }), { mode: 0o640 });
    return paths;
  } catch (error) {
    await fsp.rm(temporaryFile, { force: true });
    throw error;
  }
}

async function getOrDownload(url) {
  const cached = await getCachedEntry(url);
  if (cached) return cached;
  if (!inflight.has(url)) {
    inflight.set(url, downloadToCache(url).finally(() => inflight.delete(url)));
  }
  return inflight.get(url);
}

async function cleanExpiredCache() {
  await fsp.mkdir(cacheDir, { recursive: true });
  const entries = await fsp.readdir(cacheDir, { withFileTypes: true });
  await Promise.all(entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(async entry => {
      const metadataPath = path.join(cacheDir, entry.name);
      try {
        const metadata = JSON.parse(await fsp.readFile(metadataPath, 'utf8'));
        if (metadata.expiresAt <= Date.now()) {
          const midiPath = metadataPath.replace(/\.json$/, '.mid');
          await Promise.allSettled([fsp.unlink(metadataPath), fsp.unlink(midiPath)]);
        }
      } catch (_) {
        await fsp.rm(metadataPath, { force: true });
      }
    }));
}

function sendError(response, status, message) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-MIDI-Orchestra-Proxy': '1'
  });
  response.end(JSON.stringify({ error: message }));
}

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' || !request.url) return sendError(response, 404, 'Not found.');
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (requestUrl.pathname !== '/midi-proxy') return sendError(response, 404, 'Not found.');

  const remoteUrl = requestUrl.searchParams.get('url');
  if (!remoteUrl || remoteUrl.length > maxUrlLength) return sendError(response, 400, 'A valid MIDI URL is required.');

  let parsedUrl;
  try {
    parsedUrl = new URL(remoteUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
    if (parsedUrl.username || parsedUrl.password) throw new Error('Credentials are not permitted in MIDI URLs.');
  } catch (_) {
    return sendError(response, 400, 'Only public http or https URLs are permitted.');
  }

  try {
    const cached = await getOrDownload(parsedUrl.toString());
    const stat = await fsp.stat(cached.midi);
    response.writeHead(200, {
      'Content-Type': 'audio/sp-midi',
      'Content-Length': stat.size,
      'Cache-Control': 'private, max-age=3600',
      'X-MIDI-Orchestra-Proxy': '1'
    });
    fs.createReadStream(cached.midi).pipe(response);
  } catch (error) {
    console.error('MIDI proxy error:', error.message);
    sendError(response, 422, error.message || 'Unable to download this MIDI file.');
  }
});

async function start() {
  await cleanExpiredCache();
  setInterval(() => cleanExpiredCache().catch(error => console.error('Cache cleanup error:', error.message)), 60 * 60 * 1000).unref();
  server.listen(port, host, () => console.log(`MIDI proxy listening on http://${host}:${port}`));
}

start().catch(error => {
  console.error(error);
  process.exit(1);
});
