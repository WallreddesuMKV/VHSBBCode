'use client';

import { useState, useEffect } from 'react';
import { i18n } from './i18n';

export function useLang(initial = 'en') {
  const [lang, setLang] = useState(initial);

  useEffect(() => {
    const saved = localStorage.getItem('bbcode_lang');
    if (saved && i18n[saved]) setLang(saved);

    const onLangChange = (e) => {
      if (e.detail && i18n[e.detail]) setLang(e.detail);
    };
    window.addEventListener('bbcode-lang-change', onLangChange);
    return () => window.removeEventListener('bbcode-lang-change', onLangChange);
  }, []);

  return { lang, setLang, dict: i18n[lang] || i18n.en };
}
