import { translations } from './translations.js';

/**
 * I18nManager: Reactive Internationalization Manager for MIDI Orchestra
 * Supports English ('en') and Spanish ('es') with hot switching and localStorage persistence.
 */
export class I18nManager {
  constructor() {
    // Default to 'en' (English), or retrieve user's saved preference
    const saved = localStorage.getItem('midi_orchestra_lang');
    this.currentLocale = (saved === 'es' || saved === 'en') ? saved : 'en';
    this.listeners = [];
  }

  getLocale() {
    return this.currentLocale;
  }

  /**
   * Set language locale and update UI in real-time
   * @param {'en' | 'es'} lang
   */
  setLocale(lang) {
    if (lang !== 'en' && lang !== 'es') return;
    this.currentLocale = lang;
    localStorage.setItem('midi_orchestra_lang', lang);

    document.documentElement.lang = lang;
    this.updateDOM();

    // Notify registered listeners
    this.listeners.forEach(fn => fn(lang));
  }

  /**
   * Toggle between 'en' and 'es'
   */
  toggleLocale() {
    const next = this.currentLocale === 'en' ? 'es' : 'en';
    this.setLocale(next);
    return next;
  }

  /**
   * Translate a key path with optional arguments
   * e.g. t('camera.drums'), t('toasts.speed', 1.5)
   */
  t(keyPath, ...args) {
    const dict = translations[this.currentLocale] || translations.en;
    const parts = keyPath.split('.');
    let cur = dict;

    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) {
        cur = cur[part];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const p of parts) {
          if (fallback && typeof fallback === 'object' && p in fallback) {
            fallback = fallback[p];
          } else {
            return keyPath;
          }
        }
        cur = fallback;
        break;
      }
    }

    if (typeof cur === 'function') {
      return cur(...args);
    }

    return cur !== undefined ? cur : keyPath;
  }

  /**
   * Subscribe to locale change events
   */
  onLocaleChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Scans and updates all DOM elements containing i18n data attributes
   */
  updateDOM() {
    // 1. Plain Text Nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const text = this.t(key);
        if (text) {
          el.textContent = text;
        }
      }
    });

    // 2. HTML Nodes (for formatted text with <kbd>, <b>, etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        const html = this.t(key);
        if (html) {
          el.innerHTML = html;
        }
      }
    });

    // 3. Title Tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const title = this.t(key);
        if (title) {
          el.title = title;
        }
      }
    });

    // 4. Update Language Button Indicator Label
    const langLabel = document.getElementById('current-lang-label');
    if (langLabel) {
      langLabel.textContent = this.currentLocale.toUpperCase();
    }
  }
}

export const i18n = new I18nManager();
