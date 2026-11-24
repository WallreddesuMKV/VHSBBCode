'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { createBrowserSupabase } from '../utils/supabaseClient';
import { copyToClipboard } from '../utils/clipboard';
import { formatSectionBBCode, INDEX_HEADER_BBCODE } from '../utils/indexGenerator';
import { useLang } from '../utils/useLang';
import {
  IconIndex,
  IconCopy,
  IconCheck,
  IconSave,
  IconExternal,
} from '../components/Icons';

const DEFAULT_FORUM_URL = 'https://vhstaperepacks.com/viewforum.php?f=6&s';

export default function ReleasesIndexPage() {
  const { lang, setLang, dict } = useLang();
  const t = dict.releasesIndex;

  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);

  // Crawler settings
  const [forumUrl, setForumUrl] = useState(DEFAULT_FORUM_URL);
  const [scope, setScope] = useState('all'); // 'all' | 'p1' | 'custom'
  const [customStart, setCustomStart] = useState(1);
  const [customPages, setCustomPages] = useState(5);
  const [includeHeader, setIncludeHeader] = useState(true);

  // Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [activeView, setActiveView] = useState('bbcode'); // 'bbcode' | 'preview'
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const client = createBrowserSupabase();
    if (!client) return;
    setSupabase(client);
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });
  }, []);

  function showStatus(text, type = 'success') {
    setStatusMsg({ text, type });
    if (type !== 'loading') {
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 4500);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    showStatus(t.status_crawling, 'loading');

    try {
      let maxPages = null;
      let startPage = 1;
      if (scope === 'p1') {
        maxPages = 1;
      } else if (scope === 'custom') {
        startPage = parseInt(customStart, 10) || 1;
        maxPages = parseInt(customPages, 10) || 1;
      }

      const res = await fetch('/api/releases-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forumUrl,
          maxPages,
          startPage,
          includeHeader,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }

      setResult(data);
      setActiveSection('all');
      showStatus(
        `${t.status_done_pre}${data.totalTopics}${t.status_done_mid}${data.sectionKeys?.length || 0}${t.status_done_post}`,
        'success'
      );
    } catch (err) {
      showStatus(err.message || t.status_failed, 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyText(text, key) {
    if (!text) return;
    if (await copyToClipboard(text)) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function handleDownloadTxt(text, label) {
    if (!text) return;
    const safeLabel = label === '#' ? '0-9' : label.replace(/[^a-zA-Z0-9_-]/g, '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VHSTaPE_Index_${safeLabel}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleSaveCategory(categoryKey, bbcodeText, count) {
    if (!bbcodeText) return;
    const title = `Releases Index [ ${categoryKey} ] (${new Date().toLocaleDateString()})`;

    if (supabase && user) {
      try {
        const { error } = await supabase.from('saved_bbcodes').insert({
          user_id: user.id,
          title,
          bbcode: bbcodeText,
          form_data: { source: 'releases-index', category: categoryKey, totalTopics: count },
        });
        if (!error) {
          showStatus(`${t.saved_prefix} [ ${categoryKey} ]`, 'success');
          return;
        }
      } catch {}
    }

    try {
      const existing = JSON.parse(localStorage.getItem('saved_bbcodes_local') || '[]');
      existing.unshift({
        id: 'local_' + Date.now(),
        title,
        bbcode: bbcodeText,
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem('saved_bbcodes_local', JSON.stringify(existing));
      showStatus(`${t.saved_prefix} [ ${categoryKey} ]`, 'success');
    } catch {
      showStatus(t.save_failed, 'error');
    }
  }

  const visibleKeys = result
    ? (activeSection === 'all' ? result.sectionKeys : result.sectionKeys.filter(k => k === activeSection))
    : [];

  const filteredSections = visibleKeys
    .map(k => {
      const rawList = result?.groups?.[k] || [];
      const list = searchFilter.trim()
        ? rawList.filter(item => item.title.toLowerCase().includes(searchFilter.trim().toLowerCase()))
        : rawList;
      if (list.length === 0) return null;
      const bbcode = searchFilter.trim()
        ? formatSectionBBCode(k, list)
        : (result.sectionBBCodes?.[k] || formatSectionBBCode(k, list));
      return { key: k, list, bbcode };
    })
    .filter(Boolean);

  return (
    <>
      <Header currentLang={lang} onLangChange={setLang} />
      <main id="main-content" className="main-layout">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t.title}</h1>
            <p className="page-subtitle">{t.subtitle}</p>
          </div>
          <a
            href={DEFAULT_FORUM_URL}
            target="_blank"
            rel="noreferrer"
            className="neo-btn neo-btn-subtle"
          >
            <IconExternal size={13} />
            {t.open_forum}
          </a>
        </div>

        {/* Crawler Settings Card */}
        <div className="neo-card">
          <div className="neo-card-header">
            <span className="neo-card-title">
              <IconIndex size={14} />
              {t.crawler_title}
            </span>
          </div>
          <div className="neo-card-body">
            <div className="form-field">
              <label className="form-label" htmlFor="forum-url-input">{t.forum_url_label}</label>
              <div className="input-group">
                <input
                  id="forum-url-input"
                  type="url"
                  className="mono"
                  value={forumUrl}
                  onChange={e => setForumUrl(e.target.value)}
                  placeholder={DEFAULT_FORUM_URL}
                />
                <button
                  type="button"
                  className="neo-btn neo-btn-subtle"
                  onClick={() => setForumUrl(DEFAULT_FORUM_URL)}
                >
                  {t.reset_btn}
                </button>
              </div>
              <p className="field-hint">{t.forum_url_hint}</p>
            </div>

            <div className="form-field">
              <label className="form-label">{t.scope_label}</label>
              <div
                className="source-switch"
                style={{ maxWidth: 560, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
              >
                <button
                  type="button"
                  className={`source-btn ${scope === 'all' ? 'active' : ''}`}
                  onClick={() => setScope('all')}
                >
                  {t.scope_all}
                </button>
                <button
                  type="button"
                  className={`source-btn ${scope === 'p1' ? 'active' : ''}`}
                  onClick={() => setScope('p1')}
                >
                  {t.scope_p1}
                </button>
                <button
                  type="button"
                  className={`source-btn ${scope === 'custom' ? 'active' : ''}`}
                  onClick={() => setScope('custom')}
                >
                  {t.scope_custom}
                </button>
              </div>

              {scope === 'custom' && (
                <div className="field-grid-2" style={{ maxWidth: 340, marginTop: 10 }}>
                  <div>
                    <label className="form-label" htmlFor="custom-start">{t.start_page}</label>
                    <input
                      id="custom-start"
                      type="number"
                      min="1"
                      max="100"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="custom-pages">{t.pages_count}</label>
                    <input
                      id="custom-pages"
                      type="number"
                      min="1"
                      max="100"
                      value={customPages}
                      onChange={e => setCustomPages(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={e => setIncludeHeader(e.target.checked)}
                />
                <span>{t.include_header}</span>
              </label>
            </div>

            <div className="actions-bar">
              <button
                type="button"
                className="neo-btn neo-btn-primary"
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? <span className="spinner" aria-hidden="true" /> : <IconIndex size={15} />}
                {isGenerating ? t.generating : t.generate_btn}
              </button>
            </div>

            {statusMsg.text && (
              <div className={`status-banner show ${statusMsg.type}`}>
                {statusMsg.text}
              </div>
            )}
          </div>
        </div>

        {/* Results: Separate BBCode Card per Category (#, A, B, C, D...) */}
        {result && (
          <>
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.directory_title} ({result.totalTopics} / {result.sectionKeys.length})
                </span>
                <div
                  className="source-switch"
                  style={{ width: 176, gridTemplateColumns: '1fr 1fr', margin: 0 }}
                >
                  <button
                    type="button"
                    className={`source-btn ${activeView === 'bbcode' ? 'active' : ''}`}
                    style={{ minHeight: 32, padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setActiveView('bbcode')}
                  >
                    {t.view_bbcode}
                  </button>
                  <button
                    type="button"
                    className={`source-btn ${activeView === 'preview' ? 'active' : ''}`}
                    style={{ minHeight: 32, padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setActiveView('preview')}
                  >
                    {t.view_preview}
                  </button>
                </div>
              </div>

              <div className="neo-card-body">
                <div className="input-group" style={{ maxWidth: 420, marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder={t.search_ph}
                    aria-label={t.search_ph}
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      className="neo-btn neo-btn-subtle"
                      onClick={() => setSearchFilter('')}
                    >
                      {t.clear_search}
                    </button>
                  )}
                </div>

                <div className="index-letter-pills" role="group" aria-label={t.directory_title}>
                  <button
                    type="button"
                    className={`index-letter-pill ${activeSection === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveSection('all')}
                  >
                    {t.all_categories} ({result.totalTopics})
                  </button>
                  {result.sectionKeys.map(k => (
                    <button
                      key={k}
                      type="button"
                      className={`index-letter-pill ${activeSection === k ? 'active' : ''}`}
                      onClick={() => setActiveSection(k)}
                    >
                      {k} ({result.groups[k]?.length || 0})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Standalone Header Banner Card */}
            {includeHeader && (
              <div className="neo-card">
                <div className="neo-card-header">
                  <span className="neo-card-title">{t.header_card_title}</span>
                  <button
                    type="button"
                    className="neo-btn neo-btn-primary"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => handleCopyText(result.headerBBCode || INDEX_HEADER_BBCODE, 'header')}
                  >
                    {copiedKey === 'header' ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    {copiedKey === 'header' ? t.copied : t.copy_btn}
                  </button>
                </div>
                <div className="neo-card-body">
                  <textarea
                    className="mono"
                    rows={3}
                    readOnly
                    aria-label={t.header_card_title}
                    value={result.headerBBCode || INDEX_HEADER_BBCODE}
                  />
                </div>
              </div>
            )}

            {/* Separate Category BBCode Cards (#, A, B, C, D...) */}
            {filteredSections.length === 0 ? (
              <div className="neo-card">
                <div className="neo-card-body" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  {t.no_matches}
                </div>
              </div>
            ) : (
              <div className="index-category-list">
                {filteredSections.map(({ key, list, bbcode }) => (
                  <div key={key} className="neo-card" style={{ marginBottom: 0 }}>
                    <div className="neo-card-header">
                      <span className="neo-card-title">
                        [ {key} ]
                        <span className="index-count-meta">
                          {list.length} {list.length === 1 ? t.release_one : t.release_many}
                        </span>
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="neo-btn neo-btn-primary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleCopyText(bbcode, `cat-${key}`)}
                        >
                          {copiedKey === `cat-${key}` ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          {copiedKey === `cat-${key}` ? t.copied : `${t.copy_btn} [ ${key} ]`}
                        </button>
                        <button
                          type="button"
                          className="neo-btn neo-btn-subtle"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleDownloadTxt(bbcode, key)}
                        >
                          .txt
                        </button>
                        <button
                          type="button"
                          className="neo-btn neo-btn-subtle"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleSaveCategory(key, bbcode, list.length)}
                        >
                          <IconSave size={12} />
                          {t.save_btn}
                        </button>
                      </div>
                    </div>

                    <div className="neo-card-body">
                      {activeView === 'bbcode' ? (
                        <textarea
                          className="mono"
                          rows={Math.min(14, Math.max(4, list.length + 2))}
                          readOnly
                          aria-label={`BBCode category ${key}`}
                          value={bbcode}
                        />
                      ) : (
                        <div className="index-preview-list">
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
