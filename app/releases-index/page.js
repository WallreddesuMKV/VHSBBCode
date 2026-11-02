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
  const [searchFilter, setSearchFilter] = useState('');
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
    setStatusMsg({ text: 'Crawling VHSTaPE forum pages and formatting releases... Please wait.', type: 'info' });

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
    if (activeSection === 'all' && !searchFilter) return result.bbcode;

    const sectionsToRender = activeSection === 'all' ? result.sectionKeys : [activeSection];
    const chunks = [];

    if (includeHeader && activeSection === 'all' && !searchFilter) {
      chunks.push('[size=200]VHS TAPE Releases A-Z[/size]\r\n[b]Info: This Topic Will be Updated every once in a week, you can find all of our releases at this single topic.[/b]\r\n\r\n\r\n\r\n');
    }

    for (const k of sectionsToRender) {
      let list = result.groups[k] || [];
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        list = list.filter(t => t.title.toLowerCase().includes(q));
      }
      if (list.length > 0) {
        let b = `[b][size=150][ ${k} ][/size][/b]\r\n`;
        b += list.map(t => `[url=https://vhstaperepacks.com/viewtopic.php?t=${t.id}]${t.title}[/url]`).join('\r\n');
        chunks.push(b);
      }
    }

    return chunks.join('\r\n\r\n');
  }

  // Filtered groups for preview
  const previewSections = result ? (activeSection === 'all' ? result.sectionKeys : [activeSection]) : [];

  return (
    <>
      <Header />
      <main className="main-layout">
        {/* Profile / Auth Banner (Consistent across entire app) */}
        <div className="profile-banner">
          <div className="profile-meta">
            <div
              className="profile-avatar"
              style={{ borderColor: user ? 'var(--accent)' : 'var(--border-hover)' }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <IconLock size={20} />
              )}
            </div>
            <div className="profile-info">
              <h2>{user ? user.username : 'Guest Session — Auth Restricted'}</h2>
              <p>
                {user
                  ? 'Authorized Repacker account. You have full access to the Releases Index Generator.'
                  : 'Login with Discord to crawl VHSTaPE Game Releases and generate the alphabetized BBCode index.'}
              </p>
            </div>
          </div>
          <div>
            {user ? (
              <span
                className="source-tag"
                style={{
                  background: 'var(--success-soft)',
                  color: 'var(--success)',
                  border: '1px solid var(--success)',
                  padding: '6px 12px',
                  fontSize: 11
                }}
              >
                <IconCheck size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: -1 }} />
                AUTHORIZED MEMBER
              </span>
            ) : (
              <button className="neo-btn neo-btn-discord" onClick={handleDiscordLogin}>
                <IconDiscord size={15} />
                Login with Discord
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMsg.text && (
          <div className={`status-banner show ${statusMsg.type}`} style={{ marginBottom: 18 }}>
            {statusMsg.text}
          </div>
        )}

        {/* Loading Auth State */}
        {loadingAuth ? (
          <div className="neo-card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>
              Verifying authentication status...
            </p>
          </div>
        ) : !user ? null : (
          /* =========================================================
             Releases Index Generator Interface (Authorized Members)
             ========================================================= */
          <div>
            {/* Card 1: Configuration & Crawler Settings */}
            <div className="neo-card" style={{ marginBottom: 20 }}>
              <div className="neo-card-header">
                <span className="neo-card-title">
                  <IconIndex size={15} style={{ color: 'var(--accent)' }} />
                  FORUM CRAWLER SETTINGS
                </span>
                <span
                  className="source-tag"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-border)'
                  }}
                >
                  FORUM: VHSTAPE REPACKS
                </span>
              </div>

              <div className="neo-card-body">
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <label className="form-label">VHSTaPE Releases Forum URL</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="mono"
                      value={forumUrl}
                      onChange={e => setForumUrl(e.target.value)}
                      placeholder="https://vhstaperepacks.com/viewforum.php?f=6&s"
                    />
                    <button
                      className="neo-btn neo-btn-subtle"
                      style={{ padding: '6px 12px', fontSize: 11 }}
                      onClick={() => setForumUrl('https://vhstaperepacks.com/viewforum.php?f=6&s')}
                      title="Reset URL"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="field-hint">
                    Default target: <code>https://vhstaperepacks.com/viewforum.php?f=6&amp;s</code> (sorted by subject A-Z).
                  </p>
                </div>

                {/* Scope Selection: Neo Segmented Switch */}
                <div className="form-field" style={{ marginBottom: 18 }}>
                  <label className="form-label">Crawl Scope</label>
                  <div
                    className="source-switch"
                    style={{
                      maxWidth: 580,
                      gridTemplateColumns: '1.2fr 1fr 1fr',
                      marginBottom: 10
                    }}
                  >
                    <button
                      className={`source-btn ${scope === 'all' ? 'active' : ''}`}
                      onClick={() => setScope('all')}
                    >
                      All Pages (770+ Topics)
                    </button>
                    <button
                      className={`source-btn ${scope === 'p1' ? 'active' : ''}`}
                      onClick={() => setScope('p1')}
                    >
                      Page 1 Test (25)
                    </button>
                    <button
                      className={`source-btn ${scope === 'custom' ? 'active' : ''}`}
                      onClick={() => setScope('custom')}
                    >
                      Custom Range
                    </button>
                  </div>

                  {scope === 'custom' && (
                    <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center' }}>
                      <div style={{ width: 140 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Start Page</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                        />
                      </div>
                      <div style={{ width: 140 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Pages Count</label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={customPages}
                          onChange={e => setCustomPages(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Options Checkbox */}
                <div className="form-field" style={{ marginBottom: 22 }}>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={includeHeader}
                      onChange={e => setIncludeHeader(e.target.checked)}
                    />
                    <span>
                      Include Header Thread Banner (<code>[size=200]VHS TAPE Releases A-Z[/size]</code>)
                    </span>
                  </label>
                </div>

                {/* Generate Button */}
                <div>
                  <button
                    className="neo-btn neo-btn-primary"
                    disabled={isGenerating}
                    onClick={handleGenerate}
                    style={{ minWidth: 240, padding: '10px 24px', fontSize: 13 }}
                  >
                    {isGenerating ? (
                      <>
                        <div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
                        Crawling Forum Releases...
                      </>
                    ) : (
                      <>
                        <IconIndex size={16} />
                        Generate Releases Index
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Generated Index Directory & Output */}
            {result && (
              <div className="neo-card">
                <div className="neo-card-header">
                  <div>
                    <span className="neo-card-title">
                      BBCODE INDEX DIRECTORY
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-dim)', marginLeft: 10 }}>
                      ({result.totalTopics} releases indexed across {result.sectionKeys.length} letter groups)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* View Switch */}
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
                  {/* Search Filter & Letter Quick Jumper */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 240px', maxWidth: 320 }}>
                      <input
                        type="text"
                        placeholder="Search releases in index..."
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 12 }}
                      />
                    </div>
                    {searchFilter && (
                      <button
                        className="neo-btn neo-btn-subtle"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => setSearchFilter('')}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>

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

                  {/* BBCode Output View */}
                  {activeView === 'bbcode' ? (
                    <div className="form-field">
                      <textarea
                        className="mono"
                        rows={22}
                        readOnly
                        value={getDisplayedBBCode()}
                        style={{
                          width: '100%',
                          fontSize: 12,
                          lineHeight: 1.65,
                          background: '#08080b',
                          color: 'var(--text)'
                        }}
                      />
                    </div>
                  ) : (
                    /* Interactive Visual Preview */
                    <div
                      style={{
                        background: 'var(--surface-2)',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: 20,
                        maxHeight: 560,
                        overflowY: 'auto'
                      }}
                    >
                      {previewSections.map(k => {
                        let list = result.groups[k] || [];
                        if (searchFilter) {
                          const q = searchFilter.toLowerCase();
                          list = list.filter(t => t.title.toLowerCase().includes(q));
                        }
                        if (list.length === 0) return null;

                        return (
                          <div key={k} style={{ marginBottom: 26 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '2px solid var(--border)',
                                paddingBottom: 6,
                                marginBottom: 10
                              }}
                            >
                              <h3
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: 15,
                                  fontWeight: 800,
                                  color: 'var(--accent)'
                                }}
                              >
                                [ {k} ]
                              </h3>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {list.length} {list.length === 1 ? 'release' : 'releases'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {list.map(topic => (
                                <div key={topic.id} className="index-preview-item">
                                  <span className="topic-id-badge">t={topic.id}</span>
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
                        );
                      })}
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
