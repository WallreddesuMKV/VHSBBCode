'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { IconGenerator, IconPreview, IconHelp, IconAccount } from './Icons';

export default function Header({ currentLang = 'en', onLangChange = null }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(currentLang);

  useEffect(() => {
    const savedLang = localStorage.getItem('bbcode_lang') || currentLang || 'en';
    setLang(savedLang);

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (sbUrl && sbKey) {
      try {
        const supabase = createClient(sbUrl, sbKey);
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser({
              username: session.user.user_metadata?.custom_claims?.global_name ||
                        session.user.user_metadata?.full_name ||
                        session.user.user_metadata?.user_name ||
                        session.user.email || 'Discord User',
              avatar: session.user.user_metadata?.avatar_url || '',
            });
          }
        });
      } catch (e) {}
    }
  }, [currentLang]);

  const handleSelectLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('bbcode_lang', newLang);
    if (onLangChange) {
      onLangChange(newLang);
    }
    // Also trigger custom event for any listening component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bbcode-lang-change', { detail: newLang }));
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="brand-name">
            <span>BB</span>Code Gen
          </span>
          <span className="brand-sub">VHSTaPE</span>
        </Link>

        <nav className="nav-links">
          <Link
            href="/"
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            <IconGenerator size={14} />
            GENERATOR
          </Link>
          <Link
            href="/preview"
            className={`nav-link ${pathname === '/preview' ? 'active' : ''}`}
          >
            <IconPreview size={14} />
            PREVIEW
          </Link>
          <Link
            href="/help"
            className={`nav-link ${pathname === '/help' ? 'active' : ''}`}
          >
            <IconHelp size={14} />
            HELP
          </Link>
          <Link
            href="/account"
            className={`nav-link ${pathname === '/account' ? 'active' : ''}`}
          >
            <IconAccount size={14} />
            {user ? user.username.toUpperCase() : 'ACCOUNT'}
          </Link>
        </nav>

        {/* Language Switcher (EN / FR / JP) */}
        <div className="lang-switch">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => handleSelectLang('en')}
            title="English"
          >
            EN
          </button>
          <button
            className={`lang-btn ${lang === 'fr' ? 'active' : ''}`}
            onClick={() => handleSelectLang('fr')}
            title="Français"
          >
            FR
          </button>
          <button
            className={`lang-btn ${lang === 'jp' ? 'active' : ''}`}
            onClick={() => handleSelectLang('jp')}
            title="日本語"
          >
            JP
          </button>
        </div>
      </div>
    </header>
  );
}
