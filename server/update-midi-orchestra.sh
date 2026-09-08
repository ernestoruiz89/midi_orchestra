#!/bin/sh
set -eu

repo=/var/www/midi.appnica.com/repository
cache_dir=/var/cache/midi-orchestra-proxy

cd "$repo"
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci --no-audit --no-fund
npm run build
test -s dist/index.html
chmod -R a=rX dist

install -d -o www-data -g www-data -m 0750 "$cache_dir"
install -m 0644 server/midi-orchestra-proxy.service /etc/systemd/system/midi-orchestra-proxy.service
install -m 0644 server/midi-orchestra-proxy.nginx.conf /etc/nginx/snippets/midi-orchestra-proxy.conf
systemctl daemon-reload
systemctl enable --now midi-orchestra-proxy.service
systemctl restart midi-orchestra-proxy.service

nginx -t
systemctl reload nginx
printf 'MIDI Orchestra updated to %s\n' "$(git rev-parse --short HEAD)"
