'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { createBrowserSupabase } from '../utils/supabaseClient';
import { DISCORD_OAUTH_SCOPES, isVerifiedUser } from '../utils/discordAuth';
import {
  IconAccount,
  IconDiscord,
  IconMegaphone,
  IconSave,
  IconCopy,
  IconTrash,
  IconPlus,
  IconCheck
} from '../components/Icons';
import { copyToClipboard } from '../utils/clipboard';
import { MAX_ANNOUNCEMENT_LENGTH, resolveLoginBanner } from '../utils/announcement';
import { useLang } from '../utils/useLang';

export default function AccountPage() {
  const router = useRouter();
  const { lang, setLang, dict } = useLang();
  const t = dict.account;
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [savedBBCodes, setSavedBBCodes] = useState([]);
  const [activeTab, setActiveTab] = useState('bbcodes'); // 'bbcodes' | 'apikeys' | 'settings'
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [copiedId, setCopiedId] = useState(null);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [savedAnnouncement, setSavedAnnouncement] = useState('');
  const [crackwatchPreview, setCrackwatchPreview] = useState([]);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Per-user isolated API keys state
  const [apiKeys, setApiKeys] = useState({
    ptscreens: '',
    imgbb: '',
    pearcrypt: '',
    defaultUploader: 'ptscreens'
  });

  // Initialize Supabase, URL tab selection, and fetch user data
  useEffect(() => {
    try {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'apikeys' || tabParam === 'bbcodes' || tabParam === 'settings') {
        setActiveTab(tabParam);
      }
    } catch {}

    fetch('/api/announcement', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        const msg = String(data.message || '');
        setAnnouncementDraft(msg);
        setSavedAnnouncement(msg);
        if (Array.isArray(data.news)) setCrackwatchPreview(data.news);
      })
      .catch(() => {});

    const client = createBrowserSupabase();
    if (client) {
      try {
        setSupabase(client);

        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            handleAuthenticated(client, session.user);
          } else {
            loadGuestData();
          }
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            handleAuthenticated(client, session.user);
          } else {
            setUser(null);
            loadGuestData();
          }
        });

        return () => subscription.unsubscribe();
      } catch (e) {
        loadGuestData();
      }
    } else {
      loadGuestData();
    }
  }, []);

  async function handleAuthenticated(client, authUser) {
    const userData = {
      id: authUser.id,
      username: authUser.user_metadata?.custom_claims?.global_name ||
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.user_name ||
                authUser.email || 'Discord User',
      avatar: authUser.user_metadata?.avatar_url || '',
      discord_id: authUser.user_metadata?.provider_id || authUser.id,
      verified: isVerifiedUser(authUser)
    };
    setUser(userData);

    // 1. Fetch user-specific BBCodes
    try {
      const { data: bbcodes } = await client
        .from('saved_bbcodes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (bbcodes) {
        setSavedBBCodes(bbcodes);
      }
    } catch (err) {
      console.warn('Could not fetch saved BBCodes:', err);
    }

    // 2. Fetch user-specific API keys from Supabase
    const cachedRaw = localStorage.getItem(`bbcode_api_keys_${userData.id}`) ||
                      localStorage.getItem('bbcode_api_keys_active') ||
                      localStorage.getItem('bbcode_api_keys_guest');
    let cachedParsed = null;
    if (cachedRaw) {
      try { cachedParsed = JSON.parse(cachedRaw); } catch (e) {}
    }

    let cloudKeys = null;
    let missingPearcryptInCloud = false;
    try {
      const { data: keyRecord, error } = await client
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (!error && keyRecord && (keyRecord.ptscreens_api_key || keyRecord.imgbb_api_key || keyRecord.pearcrypt_api_key)) {
        const cloudPearcrypt = (keyRecord.pearcrypt_api_key || '').trim();
        const localPearcrypt = (cachedParsed?.pearcrypt || '').trim();
        if (!cloudPearcrypt && localPearcrypt) missingPearcryptInCloud = true;
        cloudKeys = {
          ptscreens: keyRecord.ptscreens_api_key || keyRecord.ptscreens_key || '',
          imgbb: keyRecord.imgbb_api_key || keyRecord.imgbb_key || '',
          pearcrypt: cloudPearcrypt || localPearcrypt || '',
          defaultUploader: keyRecord.default_uploader || 'ptscreens'
        };
      }
    } catch (err) {
      console.warn('Error fetching user_api_keys from Supabase:', err);
    }

    if (cloudKeys) {
      setApiKeys(cloudKeys);
      localStorage.setItem(`bbcode_api_keys_${userData.id}`, JSON.stringify(cloudKeys));
      localStorage.setItem('bbcode_api_keys_active', JSON.stringify(cloudKeys));
      if (missingPearcryptInCloud && cloudKeys.pearcrypt) {
        await client
          .from('user_api_keys')
          .upsert({
            user_id: userData.id,
            ptscreens_api_key: cloudKeys.ptscreens,
            imgbb_api_key: cloudKeys.imgbb,
            pearcrypt_api_key: cloudKeys.pearcrypt,
            default_uploader: cloudKeys.defaultUploader,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
          .catch(() => {});
      }
      return;
    }

    // 3. If Supabase has no keys yet, check browser local cache & auto-sync to Supabase
    if (cachedParsed) {
      try {
        const parsed = cachedParsed;
        if (parsed && (parsed.ptscreens || parsed.imgbb || parsed.pearcrypt)) {
          const keysToSync = {
            ptscreens: parsed.ptscreens?.trim() || '',
            imgbb: parsed.imgbb?.trim() || '',
            pearcrypt: parsed.pearcrypt?.trim() || '',
            defaultUploader: parsed.defaultUploader || 'ptscreens'
          };
          setApiKeys(keysToSync);
          localStorage.setItem(`bbcode_api_keys_${userData.id}`, JSON.stringify(keysToSync));
          localStorage.setItem('bbcode_api_keys_active', JSON.stringify(keysToSync));

          // Automatically push cached keys to Supabase user_api_keys
          const { error: syncErr } = await client
            .from('user_api_keys')
            .upsert({
              user_id: userData.id,
              ptscreens_api_key: keysToSync.ptscreens,
              imgbb_api_key: keysToSync.imgbb,
              pearcrypt_api_key: keysToSync.pearcrypt,
              default_uploader: keysToSync.defaultUploader,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (!syncErr) {
            console.log('Successfully synced cached API keys to Supabase user_api_keys');
            showToast('Cached API keys synced to your Supabase cloud account.', 'success');
          } else {
            console.error('Failed to auto-sync cached API keys:', syncErr);
          }
        }
      } catch (e) {
        console.warn('Error parsing cached API keys:', e);
      }
    }
  }

  function loadGuestData() {
    const localCodes = localStorage.getItem('saved_bbcodes_local');
    if (localCodes) {
      try { setSavedBBCodes(JSON.parse(localCodes)); } catch (e) {}
    }

    const guestKeys = localStorage.getItem('bbcode_api_keys_guest') || localStorage.getItem('bbcode_api_keys_active');
    if (guestKeys) {
      try {
        const parsed = JSON.parse(guestKeys);
        setApiKeys({
          ptscreens: parsed.ptscreens || '',
          imgbb: parsed.imgbb || '',
          pearcrypt: parsed.pearcrypt || '',
          defaultUploader: parsed.defaultUploader || 'ptscreens'
        });
      } catch (e) {}
    }
  }

  async function handleDiscordLogin() {
    if (!supabase) {
      alert('Supabase credentials not found in environment variables (.env / Vercel).');
      return;
    }
    const redirectUrl = `${window.location.origin}/auth/callback?next=/account`;
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: DISCORD_OAUTH_SCOPES,
        redirectTo: redirectUrl,
      },
    });
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      router.replace('/login');
    }
  }

  async function handleSaveApiKeys() {
    const trimmed = {
      ptscreens: apiKeys.ptscreens?.trim() || '',
      imgbb: apiKeys.imgbb?.trim() || '',
      pearcrypt: apiKeys.pearcrypt?.trim() || '',
      defaultUploader: apiKeys.defaultUploader || 'ptscreens'
    };
    setApiKeys(trimmed);

    const storageKey = user ? `bbcode_api_keys_${user.id}` : 'bbcode_api_keys_guest';
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
    localStorage.setItem('bbcode_api_keys_active', JSON.stringify(trimmed));

    if (supabase && user) {
      try {
        const { error } = await supabase
          .from('user_api_keys')
          .upsert({
            user_id: user.id,
            ptscreens_api_key: trimmed.ptscreens,
            imgbb_api_key: trimmed.imgbb,
            pearcrypt_api_key: trimmed.pearcrypt,
            default_uploader: trimmed.defaultUploader,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          // Graceful fallback if user hasn't added pearcrypt_api_key column yet
          if (String(error.message || '').includes('pearcrypt_api_key')) {
            await supabase
              .from('user_api_keys')
              .upsert({
                user_id: user.id,
                ptscreens_api_key: trimmed.ptscreens,
                imgbb_api_key: trimmed.imgbb,
                default_uploader: trimmed.defaultUploader,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
            showToast('Saved locally. Run ALTER TABLE public.user_api_keys ADD COLUMN pearcrypt_api_key in Supabase for cloud sync.', 'error');
            return;
          }
          console.error('Supabase user_api_keys upsert error:', error);
          showToast('Failed to save to Supabase: ' + (error.message || 'RLS / column error'), 'error');
          return;
        }
        showToast(t.toast_cloud_saved, 'success');
        return;
      } catch (err) {
        console.error('handleSaveApiKeys err:', err);
        showToast('Failed to save to cloud (' + (err.message || 'error') + '). ' + t.toast_local_saved, 'error');
        return;
      }
    }

    showToast(t.toast_local_saved, 'success');
  }

  function handleLoadBBCode(item) {
    if (item.form_data) {
      localStorage.setItem('bbcode_load_pending', JSON.stringify(item.form_data));
    }
    if (item.bbcode) {
      localStorage.setItem('bbcode_active_output', item.bbcode);
    }
    router.push(item.form_data?.source === 'imdb' ? '/movies' : '/');
  }

  async function handleDeleteBBCode(item) {
    if (!confirm(`${t.confirm_delete} "${item.title}"?`)) return;

    if (supabase && user && item.id) {
      try {
        await supabase.from('saved_bbcodes').delete().eq('id', item.id);
      } catch (e) {}
    }

    const updated = savedBBCodes.filter(x => x.id !== item.id);
    setSavedBBCodes(updated);
    if (!user) {
      localStorage.setItem('saved_bbcodes_local', JSON.stringify(updated));
    }
    showToast(t.toast_deleted, 'success');
  }

  async function handleCopyBBCode(item) {
    if (await copyToClipboard(item.bbcode)) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast(t.toast_copied, 'success');
    }
  }

  function showToast(text, type = 'success') {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  }

  async function handleSaveAnnouncement(clear = false) {
    if (!user?.verified) {
      showToast(t.ann_repacker_only, 'error');
      return;
    }
    setSavingAnnouncement(true);
    const nextMessage = clear ? '' : announcementDraft.trim().slice(0, MAX_ANNOUNCEMENT_LENGTH);
    try {
      const res = await fetch('/api/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: nextMessage }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Failed to update announcement (${res.status})`);
      }
      const persisted = String(json?.message || '');
      setAnnouncementDraft(persisted);
      setSavedAnnouncement(persisted);
      try {
        localStorage.setItem('bbcode_login_announcement', JSON.stringify({ ...json, news: crackwatchPreview }));
      } catch {}
      showToast(persisted ? t.ann_saved : t.ann_cleared, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save announcement.', 'error');
    } finally {
      setSavingAnnouncement(false);
    }
  }

  const previewBanner = resolveLoginBanner({ message: announcementDraft }, crackwatchPreview, 0);

  return (
    <>
      <Header currentLang={lang} onLangChange={setLang} />
      <main id="main-content" className="main-layout">
        <div className="page-header">
          <h1 className="page-title">{dict.nav.account}</h1>
        </div>
        {/* Profile Card */}
        <div className="profile-banner">
          <div className="profile-meta">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} width={48} height={48} />
              ) : (
                <IconAccount size={24} />
              )}
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h2>{user ? user.username : t.guest_session}</h2>
                {user?.verified && (
                  <span className="verified-badge">
                    <IconCheck size={12} />
                    {t.verified_repacker}
                  </span>
                )}
              </div>
              {!user && <p>{t.guest_desc}</p>}
            </div>
          </div>
          <div>
            {user ? (
              <button type="button" className="neo-btn neo-btn-subtle" onClick={handleLogout}>
                {t.logout}
              </button>
            ) : (
              <button type="button" className="neo-btn neo-btn-discord" onClick={handleDiscordLogin}>
                <IconDiscord size={15} />
                {t.login_discord}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="source-switch" style={{ maxWidth: 560, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 20 }}>
          <button
            type="button"
            className={`source-btn ${activeTab === 'bbcodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('bbcodes')}
          >
            {t.tab_saved} ({savedBBCodes.length})
          </button>
          <button
            type="button"
            className={`source-btn ${activeTab === 'apikeys' ? 'active' : ''}`}
            onClick={() => setActiveTab('apikeys')}
          >
            {t.tab_keys}
          </button>
          <button
            type="button"
            className={`source-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t.tab_settings}
          </button>
        </div>

        {statusMsg.text && (
          <div className={`status-banner show ${statusMsg.type}`} style={{ marginBottom: 16 }}>
            {statusMsg.text}
          </div>
        )}

        {/* Tab 1: Saved BBCodes */}
        {activeTab === 'bbcodes' && (
          <div className="neo-card">
            <div className="neo-card-header">
              <span className="neo-card-title">
                {t.saved_releases} ({savedBBCodes.length})
              </span>
              <button className="neo-btn neo-btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => router.push('/')}>
                <IconPlus size={12} />
                {t.new_bbcode}
              </button>
            </div>
            <div className="neo-card-body">
              {savedBBCodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-dim)' }}>
                    {t.no_saved_title}
                  </p>
                  <p className="field-hint" style={{ marginTop: 6 }}>
                    {t.no_saved_desc}
                  </p>
                </div>
              ) : (
                <div className="saved-grid">
                  {savedBBCodes.map(item => (
                    <div key={item.id || item.title} className="saved-card">
                      <div>
                        <div className="saved-card-title">{item.title}</div>
                        <div className="saved-card-date">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : t.saved_locally}
                        </div>
                      </div>
                      <div className="saved-card-actions">
                        <button
                          className="neo-btn neo-btn-primary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleLoadBBCode(item)}
                        >
                          {t.load}
                        </button>
                        <button
                          className="neo-btn neo-btn-subtle"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleCopyBBCode(item)}
                        >
                          {copiedId === item.id ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          {copiedId === item.id ? t.copied : t.copy}
                        </button>
                        <button
                          type="button"
                          className="neo-btn neo-btn-danger"
                          style={{ padding: '4px 8px', fontSize: 12, marginLeft: 'auto' }}
                          onClick={() => handleDeleteBBCode(item)}
                          aria-label={`${t.confirm_delete} ${item.title}`}
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Personal API Keys */}
        {activeTab === 'apikeys' && (
          <div className="neo-card" style={{ maxWidth: 680 }}>
            <div className="neo-card-header">
              <span className="neo-card-title">
                {t.keys_title}
              </span>
            </div>
            <div className="neo-card-body">
              <p className="field-hint" style={{ marginBottom: 18 }}>
                {t.keys_hint_pre}{user ? user.username : t.guest_session}{t.keys_hint_post}
              </p>

              <div className="form-field">
                <label className="form-label">{t.pt_label}</label>
                <input
                  type="text"
                  className="mono"
                  placeholder={t.pt_ph}
                  value={apiKeys.ptscreens}
                  onChange={e => setApiKeys({ ...apiKeys, ptscreens: e.target.value })}
                />
                <p className="field-hint">
                  {t.pt_hint_pre}<a href="https://ptscreens.com/settings/api" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-text)' }}>ptscreens.com/settings/api</a>{t.pt_hint_mid}<span className="mono">https://img.ptscreens.com/...</span>{lang === 'jp' ? '）' : ''}
                </p>
              </div>

              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">{t.imgbb_label}</label>
                <input
                  type="text"
                  className="mono"
                  placeholder={t.imgbb_ph}
                  value={apiKeys.imgbb}
                  onChange={e => setApiKeys({ ...apiKeys, imgbb: e.target.value })}
                />
                <p className="field-hint">
                  {t.imgbb_hint_pre}<a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-text)' }}>api.imgbb.com</a>{t.imgbb_hint_mid}<span className="mono">https://i.ibb.co.com/...</span>{lang === 'jp' ? '）' : ''}
                </p>
              </div>

              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">{t.pear_label}</label>
                <input
                  type="text"
                  className="mono"
                  placeholder={t.pear_ph}
                  value={apiKeys.pearcrypt}
                  onChange={e => setApiKeys({ ...apiKeys, pearcrypt: e.target.value })}
                />
                <p className="field-hint">
                  {t.pear_hint_pre}<Link href="/pearcrypt" style={{ color: 'var(--accent-text)' }}>Pearcrypt</Link>{t.pear_hint_mid}<a href="https://pearcrypt.lol/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-text)' }}>pearcrypt.lol/dashboard</a>{t.pear_hint_post}
                </p>
              </div>

              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">{t.default_uploader}</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <label className="checkbox-inline">
                    <input
                      type="radio"
                      name="defaultUploader"
                      checked={apiKeys.defaultUploader === 'ptscreens'}
                      onChange={() => setApiKeys({ ...apiKeys, defaultUploader: 'ptscreens' })}
                    />
                    <span>PTScreens (Chevereto v4)</span>
                  </label>
                  <label className="checkbox-inline">
                    <input
                      type="radio"
                      name="defaultUploader"
                      checked={apiKeys.defaultUploader === 'imgbb'}
                      onChange={() => setApiKeys({ ...apiKeys, defaultUploader: 'imgbb' })}
                    />
                    <span>ImgBB</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <button type="button" className="neo-btn neo-btn-primary" onClick={handleSaveApiKeys}>
                  <IconSave size={14} />
                  {t.save_keys}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Settings (Login Announcement) */}
        {activeTab === 'settings' && (
          <div className="neo-card" style={{ maxWidth: 680 }}>
            <div className="neo-card-header">
              <span className="neo-card-title">
                <IconMegaphone size={14} />
                {t.ann_title}
              </span>
            </div>
            <div className="neo-card-body">
              <p className="field-hint" style={{ marginTop: 0, marginBottom: 16 }}>
                {t.ann_hint}
              </p>

              {!user?.verified && (
                <div className="status-banner show error" style={{ marginTop: 0, marginBottom: 16 }}>
                  {t.ann_repacker_only}
                </div>
              )}

              <div className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <label htmlFor="login-announcement-input" className="form-label">{t.ann_label}</label>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {announcementDraft.length}/{MAX_ANNOUNCEMENT_LENGTH}
                  </span>
                </div>
                <textarea
                  id="login-announcement-input"
                  rows={3}
                  maxLength={MAX_ANNOUNCEMENT_LENGTH}
                  placeholder={t.ann_ph}
                  value={announcementDraft}
                  onChange={e => setAnnouncementDraft(e.target.value)}
                  disabled={!user?.verified || savingAnnouncement}
                />
              </div>

              <div className="form-field" style={{ marginTop: 14 }}>
                <span className="form-label">{t.ann_preview_label}</span>
                <div className={`login-wire login-wire-preview ${previewBanner.isAnnouncement ? 'is-announcement' : ''}`}>
                  <div className="login-wire-inner">
                    <div className="login-wire-body">
                      <span className="login-wire-label">
                        {previewBanner.isAnnouncement ? dict.login.announcement_badge : dict.login.crackwatch_badge}
                      </span>
                      <span className="login-wire-sep" aria-hidden="true">/</span>
                      {previewBanner.text ? (
                        <>
                          <span className="login-wire-text">{previewBanner.title}</span>
                          {!previewBanner.isAnnouncement && previewBanner.meta && (
                            <span className="login-wire-meta">{previewBanner.meta}</span>
                          )}
                        </>
                      ) : (
                        <span className="login-wire-meta">{t.ann_loading_news}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="actions-bar" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="neo-btn neo-btn-primary"
                  onClick={() => handleSaveAnnouncement(false)}
                  disabled={!user?.verified || savingAnnouncement}
                >
                  <IconSave size={14} />
                  {savingAnnouncement ? t.ann_saving : t.ann_save}
                </button>
                {(savedAnnouncement || announcementDraft) && (
                  <button
                    type="button"
                    className="neo-btn neo-btn-subtle"
                    onClick={() => handleSaveAnnouncement(true)}
                    disabled={!user?.verified || savingAnnouncement}
                  >
                    {t.ann_clear}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
