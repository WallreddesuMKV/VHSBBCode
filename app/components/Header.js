'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserSupabase } from '../utils/supabaseClient';
import {
  IconGenerator,
  IconMovie,
  IconLock,
  IconPreview,
  IconHelp,
  IconAccount,
  IconMenu,
  IconClose,
  IconSidebar,
  IconSun,
  IconMoon,
  IconSnowflake,
  IconIndex,
} from './Icons';
import { i18n } from '../utils/i18n';

function getAvailableThemes(date = new Date()) {
  const m = date.getMonth();
  return (m === 10 || m === 11 || m === 0) ? ['christmas', 'dark', 'light'] : ['dark', 'light'];
}

export default function Header({ currentLang = 'en', onLangChange = null }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(currentLang);
  const [availableThemes, setAvailableThemes] = useState(['dark', 'light']);
  const [theme, setTheme] = useState('dark');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const themeTimerRef = useRef(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('bbcode_lang') || currentLang || 'en';
    setLang(savedLang);

    const allowed = getAvailableThemes();
    const rawTheme = localStorage.getItem('bbcode_theme');
    const resolvedTheme = allowed.includes(rawTheme) ? rawTheme : allowed[0];
    setAvailableThemes(allowed);
    setTheme(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    const isCollapsed = localStorage.getItem('bbcode_sidebar') === 'collapsed';
    setCollapsed(isCollapsed);
    document.documentElement.setAttribute('data-sidebar', isCollapsed ? 'collapsed' : 'expanded');

    const onEvent = (e) => {
      if (e.detail && i18n[e.detail]) setLang(e.detail);
    };
    window.addEventListener('bbcode-lang-change', onEvent);

    const supabase = createBrowserSupabase();
    if (supabase) {
      try {
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

    return () => window.removeEventListener('bbcode-lang-change', onEvent);
  }, [currentLang]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes mobile drawer and returns focus to trigger
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleSelectLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('bbcode_lang', newLang);
    if (onLangChange) onLangChange(newLang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bbcode-lang-change', { detail: newLang }));
    }
  };

  const handleSelectTheme = (next) => {
    if (!availableThemes.includes(next)) return;
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

  const handleCycleTheme = () => {
    const idx = availableThemes.indexOf(theme);
    handleSelectTheme(availableThemes[(idx + 1) % availableThemes.length]);
  };

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('bbcode_sidebar', next ? 'collapsed' : 'expanded');
    document.documentElement.setAttribute('data-sidebar', next ? 'collapsed' : 'expanded');
  };

  const nav = (i18n[lang] || i18n.en).nav;

  const themeOptions = [
    { id: 'dark', label: nav.theme_dark, icon: IconMoon },
    { id: 'light', label: nav.theme_light, icon: IconSun },
    { id: 'christmas', label: nav.theme_christmas, icon: IconSnowflake },
  ];
  const currentThemeOpt = themeOptions.find(o => o.id === theme) || themeOptions[0];
  const CurrentThemeIcon = currentThemeOpt.icon;

  const groups = [
    {
      label: nav.group_generators,
      items: [
        { href: '/', label: nav.games, icon: IconGenerator },
        { href: '/movies', label: nav.movies, icon: IconMovie },
      ],
    },
    {
      label: nav.group_tools,
      items: [
        { href: '/pearcrypt', label: nav.pearcrypt, icon: IconLock },
        { href: '/releases-index', label: nav.releases_index, icon: IconIndex },
        { href: '/preview', label: nav.preview, icon: IconPreview },
      ],
    },
    {
      label: nav.group_workspace,
      items: [
        { href: '/help', label: nav.help, icon: IconHelp },
        { href: '/account', label: user ? user.username : nav.account, icon: IconAccount },
      ],
    },
  ];

  const renderNavContent = (isDrawer = false) => (
    <>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {groups.map(group => (
          <div key={group.label} className="sidebar-group">
            {(!collapsed || isDrawer) && (
              <div className="sidebar-group-label">{group.label}</div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={collapsed && !isDrawer ? item.label : undefined}
                  title={collapsed && !isDrawer ? item.label : undefined}
                  onClick={() => isDrawer && setMobileOpen(false)}
                >
                  <Icon size={16} />
                  {(!collapsed || isDrawer) && <span className="sidebar-link-text">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {(!collapsed || isDrawer) && (
          <div className="lang-switch" role="group" aria-label="Language">
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
        )}

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
    </>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">{nav.skip_main}</a>

      {/* Desktop Left Sidebar */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Application navigation">
        <div className="sidebar-brand-row">
          <Link href="/" className="brand" aria-label="BBCode Gen VHSTaPE home">
            <span className="brand-mark" aria-hidden="true" />
            {!collapsed && (
              <span className="brand-text">
                <span className="brand-name">BBCode Gen</span>
                <span className="brand-sub">VHSTaPE</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={handleToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? nav.expand : nav.collapse}
            title={collapsed ? nav.expand : nav.collapse}
          >
            <IconSidebar size={15} />
          </button>
        </div>

        {renderNavContent(false)}
      </aside>

      {/* Mobile & Tablet Top Bar */}
      <header className="mobile-topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">BBCode Gen</span>
          <span className="brand-sub">VHSTaPE</span>
        </Link>

        <div className="mobile-topbar-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={handleCycleTheme}
            aria-label={`${nav.theme_switch}: ${currentThemeOpt.label}`}
            title={`${nav.theme_switch}: ${currentThemeOpt.label}`}
          >
            <span key={theme} className="theme-icon-anim">
              <CurrentThemeIcon size={16} />
            </span>
          </button>
          <button
            ref={menuBtnRef}
            type="button"
            className="menu-trigger-btn"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            <IconMenu size={16} />
            <span>{nav.menu}</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => {
            setMobileOpen(false);
            menuBtnRef.current?.focus();
          }}
        >
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="mobile-drawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="sidebar-brand-row">
              <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
                <span className="brand-mark" aria-hidden="true" />
                <span className="brand-text">
                  <span className="brand-name">BBCode Gen</span>
                  <span className="brand-sub">VHSTaPE</span>
                </span>
              </Link>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setMobileOpen(false);
                  menuBtnRef.current?.focus();
                }}
                aria-label={nav.close_menu}
              >
                <IconClose size={16} />
              </button>
            </div>
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
