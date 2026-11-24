'use client';

import { useState, useEffect, useRef } from 'react';
import {
  IconDiscord,
  IconExternal,
  IconMoon,
  IconSun,
  IconSnowflake,
} from '../components/Icons';
import { createBrowserSupabase } from '../utils/supabaseClient';
import { DISCORD_OAUTH_SCOPES, sanitizeNextPath } from '../utils/discordAuth';
import { useLang } from '../utils/useLang';

function getAvailableThemes(date = new Date()) {
  const m = date.getMonth();
  return (m === 10 || m === 11 || m === 0) ? ['christmas', 'dark', 'light'] : ['dark', 'light'];
}

export default function LoginPage() {
  const { lang, setLang, dict } = useLang();
  const t = dict.login;
  const nav = dict.nav;
  const [errorCode, setErrorCode] = useState('');
  const [nextPath, setNextPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [availableThemes, setAvailableThemes] = useState(['dark', 'light']);
  const [theme, setTheme] = useState('dark');
  const themeTimerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorCode(params.get('error') || '');
    setNextPath(sanitizeNextPath(params.get('next')));

    const allowed = getAvailableThemes();
    const rawTheme = localStorage.getItem('bbcode_theme');
    const resolved = allowed.includes(rawTheme) ? rawTheme : allowed[0];
    setAvailableThemes(allowed);
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  const handleSelectLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('bbcode_lang', newLang);
    window.dispatchEvent(new CustomEvent('bbcode-lang-change', { detail: newLang }));
  };

  const handleCycleTheme = () => {
    const idx = availableThemes.indexOf(theme);
    const next = availableThemes[(idx + 1) % availableThemes.length];
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
    themeTimerRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 380);
    setTheme(next);
    localStorage.setItem('bbcode_theme', next);
    root.setAttribute('data-theme', next);
  };

  async function handleDiscordLogin() {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setErrorCode('server_config');
      return;
    }

    setLoading(true);
    setErrorCode('');
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: DISCORD_OAUTH_SCOPES,
        redirectTo,
      },
    });

    if (error) {
      setLoading(false);
      setErrorCode('oauth_failed');
    }
  }

  const themeOptions = [
    { id: 'dark', label: nav.theme_dark, icon: IconMoon },
    { id: 'light', label: nav.theme_light, icon: IconSun },
    { id: 'christmas', label: nav.theme_christmas, icon: IconSnowflake },
  ];
  const currentThemeOpt = themeOptions.find(o => o.id === theme) || themeOptions[0];
  const CurrentThemeIcon = currentThemeOpt.icon;
  const errorMessage = errorCode ? (t[`err_${errorCode}`] || t.err_unauthorized) : '';

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            <span className="brand-name">BBCode Gen</span>
            <span className="brand-sub">VHSTaPE</span>
          </span>
        </div>

        <div className="login-topbar-controls">
          <div className="lang-switch" role="group" aria-label="Language" style={{ width: 138 }}>
            {(['en', 'fr', 'jp']).map(code => (
              <button
                key={code}
                type="button"
                className={`lang-btn ${lang === code ? 'active' : ''}`}
                onClick={() => handleSelectLang(code)}
                aria-pressed={lang === code}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={handleCycleTheme}
            aria-label={`${nav.theme_switch}: ${currentThemeOpt.label}`}
            title={`${nav.theme_switch}: ${currentThemeOpt.label}`}
          >
            <span key={theme} className="theme-icon-anim">
              <CurrentThemeIcon size={15} />
            </span>
          </button>
        </div>
      </header>

      <main id="main-content" className="login-main">
        <div className="login-grid">
          <section className="login-intro">
            <h1 className="login-title">{t.title}</h1>
            <p className="login-desc">{t.desc}</p>

            <div className="vhs-stage" aria-hidden="true">
              <div className="vhs-floater">
                <svg className="vhs-tape-svg" viewBox="0 0 320 192" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer VHS cassette shell */}
                  <rect x="6" y="10" width="308" height="172" rx="10" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" />
                  {/* Top dust guard flap */}
                  <rect x="6" y="10" width="308" height="22" rx="8" fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth="2" />
                  <line x1="20" y1="21" x2="300" y2="21" stroke="var(--border)" strokeWidth="1.5" />
                  {/* Grip notches on sides */}
                  <line x1="16" y1="44" x2="16" y2="168" stroke="var(--border)" strokeWidth="1.5" />
                  <line x1="304" y1="44" x2="304" y2="168" stroke="var(--border)" strokeWidth="1.5" />
                  {/* Inner recessed cassette window housing */}
                  <rect x="28" y="42" width="264" height="82" rx="6" fill="var(--input-bg)" stroke="var(--border)" strokeWidth="1.5" />

                  {/* Left tape spool (more tape wound) */}
                  <circle cx="96" cy="83" r="32" fill="var(--surface-3)" stroke="var(--border-strong)" strokeWidth="1.5" />
                  <g className="vhs-reel vhs-reel-left">
                    <circle cx="96" cy="83" r="16" fill="var(--surface)" stroke="var(--text-dim)" strokeWidth="1.5" />
                    <circle cx="96" cy="83" r="5" fill="var(--input-bg)" stroke="var(--text-dim)" strokeWidth="1.5" />
                    <line x1="96" y1="69" x2="96" y2="75" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="96" y1="91" x2="96" y2="97" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="82" y1="83" x2="88" y2="83" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="104" y1="83" x2="110" y2="83" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* Right tape spool */}
                  <circle cx="224" cy="83" r="24" fill="var(--surface-3)" stroke="var(--border-strong)" strokeWidth="1.5" />
                  <g className="vhs-reel vhs-reel-right">
                    <circle cx="224" cy="83" r="16" fill="var(--surface)" stroke="var(--text-dim)" strokeWidth="1.5" />
                    <circle cx="224" cy="83" r="5" fill="var(--input-bg)" stroke="var(--text-dim)" strokeWidth="1.5" />
                    <line x1="224" y1="69" x2="224" y2="75" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="224" y1="91" x2="224" y2="97" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="210" y1="83" x2="216" y2="83" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="232" y1="83" x2="238" y2="83" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* Center window bridge */}
                  <rect x="134" y="54" width="52" height="58" rx="4" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1.5" />
                  <line x1="142" y1="68" x2="178" y2="68" stroke="var(--border-strong)" strokeWidth="1.5" />
                  <line x1="142" y1="83" x2="178" y2="83" stroke="var(--border-strong)" strokeWidth="1.5" />
                  <line x1="142" y1="98" x2="178" y2="98" stroke="var(--border-strong)" strokeWidth="1.5" />

                  {/* Bottom face label sticker */}
                  <rect x="28" y="134" width="264" height="36" rx="4" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1.5" />
                  {/* Signature VHSTaPE accent stripe */}
                  <rect x="28" y="134" width="10" height="36" rx="2" fill="var(--accent)" />
                  <text x="50" y="156" fill="var(--text-white)" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" letterSpacing="1.2">VHSTaPE</text>
                  <text x="278" y="156" textAnchor="end" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600">E-180 / HI-FI</text>

                  {/* Corner screws */}
                  <circle cx="18" cy="172" r="2.2" fill="var(--border-strong)" />
                  <circle cx="302" cy="172" r="2.2" fill="var(--border-strong)" />
                </svg>
              </div>
              <div className="vhs-shadow" />
            </div>
          </section>

          <section className="login-panel" aria-label={t.panel_title}>
            <div className="login-panel-head">
              <span className="neo-card-title">{t.panel_title}</span>
            </div>
            <div className="login-panel-body">
              {errorMessage && (
                <div className="status-banner show error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>
                  {errorMessage}
                </div>
              )}

              <div className="login-actions">
                <button
                  type="button"
                  className="neo-btn neo-btn-discord login-cta"
                  onClick={handleDiscordLogin}
                  disabled={loading}
                >
                  <IconDiscord size={16} />
                  <span>{loading ? t.redirecting : t.login_btn}</span>
                </button>

                <a
                  href="https://vhstaperepacks.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="neo-btn neo-btn-subtle login-cta"
                >
                  <IconExternal size={15} />
                  <span>{t.forums_btn}</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
