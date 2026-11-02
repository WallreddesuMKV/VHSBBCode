'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { createClient } from '@supabase/supabase-js';
import {
  IconIndex,
  IconLock,
  IconDiscord,
  IconCopy,
  IconCheck,
  IconSave
} from '../components/Icons';

export default function ReleasesIndexPage() {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Form settings
  const [forumUrl, setForumUrl] = useState('https://vhstaperepacks.com/viewforum.php?f=6&s');
  const [scope, setScope] = useState('all'); // 'all' | 'p1' | 'custom'
  const [customStart, setCustomStart] = useState(1);
  const [customPages, setCustomPages] = useState(5);
  const [includeHeader, setIncludeHeader] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [activeView, setActiveView] = useState('bbcode'); // 'bbcode' | 'preview'
  const [copied, setCopied] = useState(false);

  // Initialize Supabase Auth
  useEffect(() => {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (sbUrl && sbKey) {
      try {
        const client = createClient(sbUrl, sbKey);
        setSupabase(client);

        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            handleUser(session.user, session.access_token);
          }
          setLoadingAuth(false);
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            handleUser(session.user, session.access_token);
          } else {
            setUser(null);
            setAuthToken(null);
          }
          setLoadingAuth(false);
        });

        return () => subscription.unsubscribe();
      } catch (e) {
        setLoadingAuth(false);
      }
    } else {
      // In local dev without Supabase env vars, allow testing
      setLoadingAuth(false);
    }
  }, []);

  function handleUser(authUser, token) {
    setUser({
      id: authUser.id,
      username: authUser.user_metadata?.custom_claims?.global_name ||
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.user_name ||
                authUser.email || 'Discord User',
      avatar: authUser.user_metadata?.avatar_url || '',
      discord_id: authUser.user_metadata?.provider_id || authUser.id
    });
    setAuthToken(token);
  }

  async function handleDiscordLogin() {
    if (!supabase) {
      alert('Supabase credentials not found in environment variables.');
      return;
    }
    const redirectUrl = `${window.location.origin}/auth/callback?next=/releases-index`;
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: redirectUrl }
    });
  }

  function showToast(text, type = 'success') {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setStatusMsg({ text: 'Fetching forum pages and organizing releases... Please wait.', type: 'info' });

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      let maxPages = null;
      let startPage = 1;

      if (scope === 'p1') {
        maxPages = 1;
        startPage = 1;
      } else if (scope === 'custom') {
        startPage = parseInt(customStart, 10) || 1;
        maxPages = parseInt(customPages, 10) || 1;
      }

      const res = await fetch('/api/releases-index', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          forumUrl,
          maxPages,
          startPage,
          includeHeader
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      setResult(data);
      setActiveSection('all');
      showToast(`Successfully indexed ${data.totalTopics} releases across ${data.sectionKeys?.length || 0} sections!`, 'success');
    } catch (err) {
      console.error('Error generating releases index:', err);
      showToast(err.message || 'Failed to generate index.', 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopyBBCode() {
    if (!result?.bbcode) return;
    const textToCopy = getDisplayedBBCode();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('BBCode copied to clipboard!', 'success');
    });
  }

  function handleDownloadTxt() {
    if (!result?.bbcode) return;
    const text = getDisplayedBBCode();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VHSTaPE_Releases_Index_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded BBCode .txt file.', 'success');
  }

  async function handleSaveBBCode() {
    if (!result?.bbcode) return;
    const title = `Releases Index [A - Z] (${new Date().toLocaleDateString()})`;
    const fullBBCode = result.bbcode;

    if (supabase && user) {
      try {
        const { error } = await supabase.from('saved_bbcodes').insert({
          user_id: user.id,
          title,
          bbcode: fullBBCode,
          form_data: { source: 'releases-index', totalTopics: result.totalTopics }
        });
        if (!error) {
          showToast('Saved to your Account releases!', 'success');
          return;
        }
      } catch (e) {}
    }

    // Local fallback
    try {
      const existing = JSON.parse(localStorage.getItem('saved_bbcodes_local') || '[]');
      existing.unshift({
        id: 'local_' + Date.now(),
        title,
        bbcode: fullBBCode,
        updated_at: new Date().toISOString()
      });
      localStorage.setItem('saved_bbcodes_local', JSON.stringify(existing));
      showToast('Saved to local storage.', 'success');
    } catch (e) {
      showToast('Could not save BBCode.', 'error');
    }
  }

  function getDisplayedBBCode() {
    if (!result) return '';
    if (activeSection === 'all') return result.bbcode;

    // Filter to specific section
    const list = result.groups[activeSection] || [];
    let b = `[b][size=150][ ${activeSection} ][/size][/b]\r\n`;
    b += list.map(t => `[url=https://vhstaperepacks.com/viewtopic.php?t=${t.id}]${t.title}[/url]`).join('\r\n');
    return b;
  }

  return (
    <>
      <Header />
      <main className="main-layout">
        {/* Loading Auth State */}
        {loadingAuth ? (
          <div className="neo-card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
              Verifying authentication status...
            </p>
          </div>
        ) : !user && process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          /* Auth Gate Card (Non-authenticated Users) */
          <div className="auth-gate-card">
            <div className="auth-gate-icon">
              <IconLock size={26} />
            </div>
            <h2 className="auth-gate-title">Authentication Required</h2>
            <p className="auth-gate-desc">
              The <strong>VHSTaPE Releases Index Generator</strong> is restricted to authorized members only.
              Please sign in with Discord to access forum crawling and index generation.
            </p>
            <div>
              <button className="neo-btn neo-btn-discord" onClick={handleDiscordLogin} style={{ margin: '0 auto' }}>
                <IconDiscord size={16} />
                Login with Discord to Access
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Releases Index Generator Interface */
          <div>
            {/* User Greeting Banner */}
            {user && (
              <div className="profile-banner" style={{ marginBottom: 20 }}>
                <div className="profile-meta">
                  <div className="profile-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <IconIndex size={24} />
                    )}
                  </div>
                  <div className="profile-info">
                    <h2>Releases Index Generator</h2>
                    <p>
                      Authorized as <strong style={{ color: 'var(--text-white)' }}>{user.username}</strong>. Auto-crawls VHSTaPE Game Releases forum and formats alphabetized BBCode.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Toast */}
            {statusMsg.text && (
              <div className={`status-banner show ${statusMsg.type}`} style={{ marginBottom: 18 }}>
                {statusMsg.text}
              </div>
            )}

            {/* Generator Configuration Card */}
            <div className="neo-card" style={{ marginBottom: 20 }}>
              <div className="neo-card-header">
                <span className="neo-card-title">
                  <IconIndex size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                  Forum Releases Index Settings
                </span>
                <span className="source-tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  phpBB Forum Crawler
                </span>
              </div>
              <div className="neo-card-body">
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <label className="form-label">VHSTaPE Releases Forum URL</label>
                  <input
                    type="text"
                    className="mono"
                    value={forumUrl}
                    onChange={e => setForumUrl(e.target.value)}
                    placeholder="https://vhstaperepacks.com/viewforum.php?f=6&s"
                  />
                  <p className="field-hint">
                    Target URL defaults to <code>https://vhstaperepacks.com/viewforum.php?f=6&amp;s</code> (sorted by subject A-Z).
                  </p>
                </div>

                {/* Scope Selection */}
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <label className="form-label">Crawl Scope</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
                    <label className="checkbox-inline">
                      <input
                        type="radio"
                        name="crawlScope"
                        checked={scope === 'all'}
                        onChange={() => setScope('all')}
                      />
                      <span>Complete Forum Index (All 700+ releases)</span>
                    </label>
                    <label className="checkbox-inline">
                      <input
                        type="radio"
                        name="crawlScope"
                        checked={scope === 'p1'}
                        onChange={() => setScope('p1')}
                      />
                      <span>Quick Test (Page 1 only / 25 topics)</span>
                    </label>
                    <label className="checkbox-inline">
                      <input
                        type="radio"
                        name="crawlScope"
                        checked={scope === 'custom'}
                        onChange={() => setScope('custom')}
                      />
                      <span>Custom Page Range</span>
                    </label>
                  </div>

                  {scope === 'custom' && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Start Page</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          style={{ width: 100 }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Pages Count</label>
                        <input
                          type="number"
                          min="1"
                          max="35"
                          value={customPages}
                          onChange={e => setCustomPages(e.target.value)}
                          style={{ width: 100 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Header Option */}
                <div className="form-field" style={{ marginBottom: 20 }}>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={includeHeader}
                      onChange={e => setIncludeHeader(e.target.checked)}
                    />
                    <span>
                      Include Thread Header (<code>[size=200]VHS TAPE Releases A-Z[/size]</code>)
                    </span>
                  </label>
                </div>

                {/* Generate Button */}
                <div>
                  <button
                    className="neo-btn neo-btn-primary"
                    disabled={isGenerating}
                    onClick={handleGenerate}
                    style={{ minWidth: 200 }}
                  >
                    {isGenerating ? (
                      <>
                        <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        Crawling Forum...
                      </>
                    ) : (
                      <>
                        <IconIndex size={14} />
                        Generate Releases Index
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Result BBCode Output Card */}
            {result && (
              <div className="neo-card">
                <div className="neo-card-header">
                  <div>
                    <span className="neo-card-title">
                      BBCode Index Output
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-dim)', marginLeft: 10 }}>
                      ({result.totalTopics} releases across {result.sectionKeys.length} sections)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="source-switch" style={{ width: 160, margin: 0 }}>
                      <button
                        className={`source-btn ${activeView === 'bbcode' ? 'active' : ''}`}
                        onClick={() => setActiveView('bbcode')}
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        BBCode
                      </button>
                      <button
                        className={`source-btn ${activeView === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveView('preview')}
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        Preview
                      </button>
                    </div>

                    <button
                      className="neo-btn neo-btn-primary"
                      onClick={handleCopyBBCode}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      {copied ? 'Copied!' : 'Copy BBCode'}
                    </button>
                    <button
                      className="neo-btn neo-btn-subtle"
                      onClick={handleDownloadTxt}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      Download .txt
                    </button>
                    <button
                      className="neo-btn neo-btn-subtle"
                      onClick={handleSaveBBCode}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      <IconSave size={12} />
                      Save
                    </button>
                  </div>
                </div>

                <div className="neo-card-body">
                  {/* Letter filter pills */}
                  <div className="index-letter-pills">
                    <button
                      className={`index-letter-pill ${activeSection === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveSection('all')}
                    >
                      ALL ({result.totalTopics})
                    </button>
                    {result.sectionKeys.map(k => (
                      <button
                        key={k}
                        className={`index-letter-pill ${activeSection === k ? 'active' : ''}`}
                        onClick={() => setActiveSection(k)}
                      >
                        [ {k} ] ({result.groups[k]?.length || 0})
                      </button>
                    ))}
                  </div>

                  {activeView === 'bbcode' ? (
                    <div className="form-field">
                      <textarea
                        className="mono"
                        rows={22}
                        readOnly
                        value={getDisplayedBBCode()}
                        style={{ width: '100%', fontSize: 12, lineHeight: 1.5, background: 'var(--input-bg)' }}
                      />
                    </div>
                  ) : (
                    /* Visual Preview */
                    <div
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: 20,
                        maxHeight: 520,
                        overflowY: 'auto'
                      }}
                    >
                      {(activeSection === 'all' ? result.sectionKeys : [activeSection]).map(k => (
                        <div key={k} style={{ marginBottom: 24 }}>
                          <h3
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 16,
                              color: 'var(--accent)',
                              borderBottom: '1px solid var(--border)',
                              paddingBottom: 4,
                              marginBottom: 10
                            }}
                          >
                            [ {k} ]
                          </h3>
                          <div>
                            {(result.groups[k] || []).map(topic => (
                              <div key={topic.id} className="index-preview-item">
                                <a
                                  href={`https://vhstaperepacks.com/viewtopic.php?t=${topic.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {topic.title}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
