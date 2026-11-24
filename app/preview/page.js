'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Link from 'next/link';
import { IconCopy, IconCheck, IconGenerator, IconMovie } from '../components/Icons';
import { copyToClipboard } from '../utils/clipboard';
import { DEFAULT_PREVIEW_BBCODE, parseBBCode } from '../utils/parseBBCode';
import { useLang } from '../utils/useLang';

export default function PreviewPage() {
  const { lang, setLang, dict } = useLang();
  const t = dict.preview;
  const [bbcode, setBbcode] = useState(DEFAULT_PREVIEW_BBCODE);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState({ text: '', type: '' });

  useEffect(() => {
    const cached = localStorage.getItem('bbcode_active_output');
    if (cached && cached.trim()) {
      setBbcode(cached);
    }
  }, []);

  function showNotice(text, type = 'success') {
    setNotice({ text, type });
    setTimeout(() => setNotice({ text: '', type: '' }), 3000);
  }

  async function handleCopy() {
    if (await copyToClipboard(bbcode)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleLoadActive() {
    const cached = localStorage.getItem('bbcode_active_output');
    if (cached && cached.trim()) {
      setBbcode(cached);
      showNotice(t.load_latest, 'success');
    } else {
      showNotice(t.no_active_alert, 'error');
    }
  }

  function handleLoadExample() {
    setBbcode(DEFAULT_PREVIEW_BBCODE);
    showNotice(t.load_example, 'success');
  }

  return (
    <>
      <Header currentLang={lang} onLangChange={setLang} />
      <main id="main-content" className="main-layout">
        <div className="page-header">
          <h1 className="page-title">{t.title}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="neo-btn neo-btn-subtle" onClick={handleLoadActive}>
              {t.load_latest}
            </button>
            <button type="button" className="neo-btn neo-btn-subtle" onClick={handleLoadExample}>
              {t.load_example}
            </button>
            <Link href="/" className="neo-btn neo-btn-primary">
              <IconGenerator size={14} />
              {t.back_games}
            </Link>
            <Link href="/movies" className="neo-btn neo-btn-subtle">
              <IconMovie size={14} />
              {t.back_movies}
            </Link>
          </div>
        </div>

        {notice.text && (
          <div className={`status-banner show ${notice.type}`} style={{ marginTop: 0, marginBottom: 16 }}>
            {notice.text}
          </div>
        )}

        <div className="preview-grid">
          {/* Editor */}
          <div className="neo-card">
            <div className="neo-card-header">
              <span className="neo-card-title">
                {t.raw_editor}
              </span>
              <button
                type="button"
                className="neo-btn neo-btn-subtle"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={handleCopy}
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <div className="neo-card-body">
              <textarea
                className="mono"
                aria-label={t.raw_editor}
                value={bbcode}
                onChange={e => setBbcode(e.target.value)}
                style={{ height: 560, resize: 'vertical' }}
                placeholder={t.placeholder}
              />
            </div>
          </div>

          {/* Rendered View */}
          <div className="neo-card">
            <div className="neo-card-header">
              <span className="neo-card-title">
                {t.simulation}
              </span>
            </div>
            <div className="neo-card-body">
              <div
                style={{
                  background: '#101217',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 20,
                  minHeight: 540,
                  lineHeight: 1.65,
                  color: '#eceef2',
                  overflowWrap: 'anywhere',
                }}
                dangerouslySetInnerHTML={{ __html: parseBBCode(bbcode) }}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
