'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { createClient } from '@supabase/supabase-js';
import {
  IconAccount,
  IconDiscord,
  IconSave,
  IconCopy,
  IconTrash,
  IconPlus,
  IconCheck
} from '../components/Icons';

export default function AccountPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [savedBBCodes, setSavedBBCodes] = useState([]);
  const [activeTab, setActiveTab] = useState('bbcodes'); // 'bbcodes' | 'apikeys'
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [copiedId, setCopiedId] = useState(null);

  // Per-user isolated API keys state
  const [apiKeys, setApiKeys] = useState({
    ptscreens: '',
    imgbb: '',
    defaultUploader: 'ptscreens'
  });

  // Initialize Supabase and fetch user data
  useEffect(() => {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (sbUrl && sbKey) {
      try {
        const client = createClient(sbUrl, sbKey);
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
      discord_id: authUser.user_metadata?.provider_id || authUser.id
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
    let cloudKeys = null;
    try {
      const { data: keyRecord, error } = await client
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (!error && keyRecord && (keyRecord.ptscreens_api_key || keyRecord.imgbb_api_key)) {
        cloudKeys = {
          ptscreens: keyRecord.ptscreens_api_key || keyRecord.ptscreens_key || '',
          imgbb: keyRecord.imgbb_api_key || keyRecord.imgbb_key || '',
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
      return;
    }

    // 3. If Supabase has no keys yet, check browser local cache & auto-sync to Supabase
    const cachedRaw = localStorage.getItem(`bbcode_api_keys_${userData.id}`) ||
                      localStorage.getItem('bbcode_api_keys_active') ||
                      localStorage.getItem('bbcode_api_keys_guest');
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw);
        if (parsed && (parsed.ptscreens || parsed.imgbb)) {
          const keysToSync = {
            ptscreens: parsed.ptscreens?.trim() || '',
            imgbb: parsed.imgbb?.trim() || '',
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
      try { setApiKeys(JSON.parse(guestKeys)); } catch (e) {}
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
      options: { redirectTo: redirectUrl }
    });
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      loadGuestData();
      showToast('Logged out successfully.', 'success');
    }
  }

  async function handleSaveApiKeys() {
    const trimmed = {
      ptscreens: apiKeys.ptscreens?.trim() || '',
      imgbb: apiKeys.imgbb?.trim() || '',
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
            default_uploader: trimmed.defaultUploader,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Supabase user_api_keys upsert error:', error);
          showToast('Failed to save to your account ');
          return;
        }
        showToast('API keys saved to your account.', 'success');
        return;
      } catch (err) {
        console.error('handleSaveApiKeys err:', err);
        showToast('Failed to save to cloud (' + (err.message || 'error') + '). Saved locally.', 'error');
        return;
      }
    }

    showToast('API keys saved locally.', 'success');
  }

  function handleLoadBBCode(item) {
    if (item.form_data) {
      localStorage.setItem('bbcode_load_pending', JSON.stringify(item.form_data));
    }
    router.push('/');
  }

  async function handleDeleteBBCode(item) {
    if (!confirm(`Delete saved BBCode "${item.title}"?`)) return;

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
    showToast('BBCode deleted.', 'success');
  }

  function handleCopyBBCode(item) {
    navigator.clipboard.writeText(item.bbcode).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast('BBCode copied to clipboard.', 'success');
    });
  }

  function showToast(text, type = 'success') {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  }

  return (
    <>
      <Header />
      <main className="main-layout">
        {/* Profile Card */}
        <div className="profile-banner">
          <div className="profile-meta">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <IconAccount size={24} />
              )}
            </div>
            <div className="profile-info">
              <h2>{user ? user.username : 'Guest Session'}</h2>
              {!user && (
                <p>Login with Discord to sync saved BBCodes &amp; personal API keys across your devices.</p>
              )}
            </div>
          </div>
          <div>
            {user ? (
              <button className="neo-btn neo-btn-subtle" onClick={handleLogout}>
                Log Out
              </button>
            ) : (
              <button className="neo-btn neo-btn-discord" onClick={handleDiscordLogin}>
                <IconDiscord size={15} />
                Login with Discord
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="source-switch" style={{ maxWidth: 420, gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
          <button
            className={`source-btn ${activeTab === 'bbcodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('bbcodes')}
          >
            Saved BBCodes ({savedBBCodes.length})
          </button>
          <button
            className={`source-btn ${activeTab === 'apikeys' ? 'active' : ''}`}
            onClick={() => setActiveTab('apikeys')}
          >
            Personal API Keys
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
                Saved Releases ({savedBBCodes.length})
              </span>
              <button className="neo-btn neo-btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => router.push('/')}>
                <IconPlus size={12} />
                New BBCode
              </button>
            </div>
            <div className="neo-card-body">
              {savedBBCodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-dim)' }}>
                    No saved BBCodes found.
                  </p>
                  <p className="field-hint" style={{ marginTop: 6 }}>
                    Generate a release on the generator page and click "Save BBCode" to store it here.
                  </p>
                </div>
              ) : (
                <div className="saved-grid">
                  {savedBBCodes.map(item => (
                    <div key={item.id || item.title} className="saved-card">
                      <div>
                        <div className="saved-card-title">{item.title}</div>
                        <div className="saved-card-date">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Saved locally'}
                        </div>
                      </div>
                      <div className="saved-card-actions">
                        <button
                          className="neo-btn neo-btn-primary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleLoadBBCode(item)}
                        >
                          Load
                        </button>
                        <button
                          className="neo-btn neo-btn-subtle"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => handleCopyBBCode(item)}
                        >
                          {copiedId === item.id ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          {copiedId === item.id ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          className="neo-btn neo-btn-danger"
                          style={{ padding: '4px 8px', fontSize: 11, marginLeft: 'auto' }}
                          onClick={() => handleDeleteBBCode(item)}
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
                Personal Image Host API Keys
              </span>
            </div>
            <div className="neo-card-body">
              <p className="field-hint" style={{ marginBottom: 18 }}>
                API keys are saved individually per user account ({user ? user.username : 'Guest'}). Different users retain distinct keys.
              </p>

              <div className="form-field">
                <label className="form-label">PTScreens.com API Key (Chevereto v4)</label>
                <input
                  type="text"
                  className="mono"
                  placeholder="Enter ptscreens.com API key"
                  value={apiKeys.ptscreens}
                  onChange={e => setApiKeys({ ...apiKeys, ptscreens: e.target.value })}
                />
                <p className="field-hint">
                  Available in <a href="https://ptscreens.com/settings/api" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>ptscreens.com/settings/api</a>. Direct link will be formatted as <span className="mono">https://img.ptscreen.com/...</span>
                </p>
              </div>

              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">ImgBB.com API Key</label>
                <input
                  type="text"
                  className="mono"
                  placeholder="Enter api.imgbb.com key"
                  value={apiKeys.imgbb}
                  onChange={e => setApiKeys({ ...apiKeys, imgbb: e.target.value })}
                />
                <p className="field-hint">
                  Available in <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>api.imgbb.com</a>. Direct link will be formatted as <span className="mono">https://i.ibb.co.com/...</span>
                </p>
              </div>

              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">Default Uploader Host</label>
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
                <button className="neo-btn neo-btn-primary" onClick={handleSaveApiKeys}>
                  <IconSave size={14} />
                  Save API Keys
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
