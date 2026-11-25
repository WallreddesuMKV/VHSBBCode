'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserSupabase } from '../utils/supabaseClient';
import Header from '../components/Header';
import {
  IconLock,
  IconPlus,
  IconClose,
  IconCopy,
  IconCheck,
  IconTrash,
  IconRefresh,
  IconExternal,
  IconSave,
} from '../components/Icons';
import {
  buildCreateContainerPayload,
  buildUpdateContainerPayload,
  getContainerShareUrl,
  parseBulkUrls,
} from '../utils/pearcrypt';
import { copyToClipboard } from '../utils/clipboard';
import { useLang } from '../utils/useLang';

function makeEmptyLink() {
  return { id: Date.now() + Math.random(), url: '' };
}

function makeEmptyMirror(index = 1) {
  return { id: Date.now() + Math.random(), name: `Mirror ${index}`, links: [makeEmptyLink()] };
}

export default function PearcryptPage() {
  const { lang, setLang, dict } = useLang();
  const t = dict.pearcrypt;
  const [apiKey, setApiKey] = useState('');
  const [keyReady, setKeyReady] = useState(false);

  // Create container form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [mirrors, setMirrors] = useState([makeEmptyMirror(1)]);
  const [creating, setCreating] = useState(false);
  const [formStatus, setFormStatus] = useState({ text: '', type: '' });
  const [createdContainer, setCreatedContainer] = useState(null);

  // Containers list
  const [containers, setContainers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [listStatus, setListStatus] = useState({ text: '', type: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Edit modal & filename recheck
  const [editing, setEditing] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editStatus, setEditStatus] = useState({ text: '', type: '' });
  const [recheckingId, setRecheckingId] = useState(null);
  const [recheckCooldowns, setRecheckCooldowns] = useState({});
  const [cooldownNow, setCooldownNow] = useState(Date.now());

  // Load Pearcrypt API key from localStorage & Supabase session
  useEffect(() => {
    const readLocalKey = (userId) => {
      const raw = (userId && localStorage.getItem(`bbcode_api_keys_${userId}`))
        || localStorage.getItem('bbcode_api_keys_active')
        || localStorage.getItem('bbcode_api_keys_guest');
      if (!raw) return '';
      try {
        return JSON.parse(raw)?.pearcrypt?.trim() || '';
      } catch (e) {
        return '';
      }
    };

    const initialLocal = readLocalKey(null);
    if (initialLocal) setApiKey(initialLocal);

    const client = createBrowserSupabase();
    if (!client) {
      setKeyReady(true);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          const localForUser = readLocalKey(session.user.id);
          const { data } = await client
            .from('user_api_keys')
            .select('pearcrypt_api_key, ptscreens_api_key, imgbb_api_key, default_uploader')
            .eq('user_id', session.user.id)
            .maybeSingle();
          const cloudKey = String(data?.pearcrypt_api_key || '').trim();
          const resolved = (cloudKey || localForUser || '').trim();
          if (active && resolved) setApiKey(resolved);

          // Push local key up to Supabase if Supabase doesn't have it yet
          if (!cloudKey && localForUser) {
            await client
              .from('user_api_keys')
              .upsert({
                user_id: session.user.id,
                ptscreens_api_key: data?.ptscreens_api_key || '',
                imgbb_api_key: data?.imgbb_api_key || '',
                pearcrypt_api_key: localForUser,
                default_uploader: data?.default_uploader || 'ptscreens',
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' })
              .catch(() => {});
          } else if (cloudKey) {
            // Keep browser cache in sync with Supabase cloud key
            try {
              const prevRaw = localStorage.getItem(`bbcode_api_keys_${session.user.id}`) || localStorage.getItem('bbcode_api_keys_active');
              const prevObj = prevRaw ? JSON.parse(prevRaw) : {};
              const nextObj = { ...prevObj, pearcrypt: cloudKey };
              localStorage.setItem(`bbcode_api_keys_${session.user.id}`, JSON.stringify(nextObj));
              localStorage.setItem('bbcode_api_keys_active', JSON.stringify(nextObj));
            } catch {}
          }
        }
      } catch (e) {}
      if (active) setKeyReady(true);
    })();

    return () => { active = false; };
  }, []);

  const fetchContainers = useCallback(async (keyOverride) => {
    const activeKey = (keyOverride ?? apiKey).trim();
    if (!activeKey) return [];
    setLoadingList(true);
    setListStatus({ text: '', type: '' });
    try {
      const res = await fetch('/api/pearcrypt', {
        headers: { 'x-api-key': activeKey },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Failed to load containers (${res.status})`);
      }
      const list = Array.isArray(json?.data) ? json.data : [];
      setContainers(list);
      return list;
    } catch (err) {
      setListStatus({ text: err.message || 'Failed to load containers.', type: 'error' });
      return [];
    } finally {
      setLoadingList(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (keyReady && apiKey) {
      fetchContainers(apiKey);
    }
  }, [keyReady, apiKey, fetchContainers]);

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setEditing(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editing]);

  async function copyText(text, key) {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function makeBBCodeLink(container) {
    const url = getContainerShareUrl(container);
    return `[size=105][url=${url}][color=#FFFFFF]Mirror (Pearcrypt)[/color][/url][/size]`;
  }

  // --- Mirror / Link Form Helpers ---
  function updateMirrorName(mirrorIdx, value) {
    setMirrors(prev => prev.map((m, i) => (i === mirrorIdx ? { ...m, name: value } : m)));
  }

  function addMirror() {
    setMirrors(prev => [...prev, makeEmptyMirror(prev.length + 1)]);
  }

  function removeMirror(mirrorIdx) {
    setMirrors(prev => (prev.length <= 1 ? [makeEmptyMirror(1)] : prev.filter((_, i) => i !== mirrorIdx)));
  }

  function updateLinkUrl(mirrorIdx, linkIdx, value) {
    setMirrors(prev => prev.map((m, mi) => {
      if (mi !== mirrorIdx) return m;
      return {
        ...m,
        links: m.links.map((l, li) => (li === linkIdx ? { ...l, url: value } : l)),
      };
    }));
  }

  function addLink(mirrorIdx) {
    setMirrors(prev => prev.map((m, mi) => (
      mi === mirrorIdx ? { ...m, links: [...m.links, makeEmptyLink()] } : m
    )));
  }

  function removeLink(mirrorIdx, linkIdx) {
    setMirrors(prev => prev.map((m, mi) => {
      if (mi !== mirrorIdx) return m;
      const next = m.links.filter((_, li) => li !== linkIdx);
      return { ...m, links: next.length > 0 ? next : [makeEmptyLink()] };
    }));
  }

  function handleUrlPaste(e, mirrorIdx, linkIdx) {
    const pasted = e.clipboardData?.getData('text') || '';
    const urls = parseBulkUrls(pasted);
    if (urls.length <= 1) return;
    e.preventDefault();
    setMirrors(prev => prev.map((m, mi) => {
      if (mi !== mirrorIdx) return m;
      const newRows = urls.map(url => ({ id: Date.now() + Math.random(), url }));
      const next = [...m.links];
      next.splice(linkIdx, 1, ...newRows);
      return { ...m, links: next };
    }));
  }

  function resetCreateForm() {
    setTitle('');
    setDescription('');
    setIsProtected(false);
    setPassword('');
    setMirrors([makeEmptyMirror(1)]);
    setFormStatus({ text: '', type: '' });
  }

  // --- Create Container (POST /api/pearcrypt) ---
  async function handleCreateContainer(e) {
    e.preventDefault();
    if (!apiKey) {
      setFormStatus({ text: 'Pearcrypt API key is required. Set your key in Account > Personal API Keys.', type: 'error' });
      return;
    }

    let payload;
    try {
      payload = buildCreateContainerPayload({ title, description, isProtected, password, mirrors });
    } catch (err) {
      setFormStatus({ text: err.message, type: 'error' });
      return;
    }

    setCreating(true);
    setFormStatus({ text: t.status_creating, type: 'loading' });
    setCreatedContainer(null);

    try {
      const res = await fetch('/api/pearcrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Failed to create container (${res.status})`);
      }

      const created = json?.data || json;
      setCreatedContainer(created);
      setFormStatus({ text: t.status_created, type: 'success' });
      setTitle('');
      setDescription('');
      setIsProtected(false);
      setPassword('');
      setMirrors([makeEmptyMirror(1)]);
      fetchContainers();
    } catch (err) {
      const msg = err.message || 'Failed to create container.';
      setFormStatus({ text: msg, type: 'error' });
      if (/timed out|timeout/i.test(msg)) fetchContainers();
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const ids = Object.keys(recheckCooldowns);
    if (ids.length === 0) return;
    const iv = setInterval(() => {
      const now = Date.now();
      setCooldownNow(now);
      setRecheckCooldowns(prev => {
        let changed = false;
        const next = {};
        for (const [k, ts] of Object.entries(prev)) {
          if (now - ts < 60000) next[k] = ts;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [recheckCooldowns]);

  function getRecheckCooldownSeconds(containerId) {
    const started = recheckCooldowns[containerId];
    if (!started) return 0;
    return Math.max(0, 60 - Math.floor((cooldownNow - started) / 1000));
  }

  function makeEditMirror(m, idx) {
    const resolvedLinks = Array.isArray(m?.links) ? m.links : [];
    return {
      id: m?.id || Date.now() + Math.random() + idx,
      name: m?.name || `Mirror ${idx + 1}`,
      linksText: resolvedLinks.map(l => l.url).filter(Boolean).join('\n'),
      resolvedLinks,
      manuallyNamed: Boolean(m?.name),
    };
  }

  // --- Update Container & Recheck Filenames (PUT / PATCH /api/pearcrypt?id=...) ---
  function openEditModal(container) {
    setEditStatus({ text: '', type: '' });
    const sourceMirrors = Array.isArray(container.mirrors) && container.mirrors.length > 0
      ? container.mirrors.map((m, idx) => makeEditMirror(m, idx))
      : [{ id: Date.now(), name: 'Mirror 1', linksText: '', resolvedLinks: [], manuallyNamed: false }];
    setEditing({
      id: container.id,
      title: container.title || '',
      description: container.description || '',
      isProtected: Boolean(container.is_protected),
      password: '',
      mirrors: sourceMirrors,
    });
  }

  function updateEditMirrorName(idx, value) {
    setEditing(prev => prev && ({
      ...prev,
      mirrors: prev.mirrors.map((m, i) => (i === idx ? { ...m, name: value, manuallyNamed: true } : m)),
    }));
  }

  function updateEditMirrorLinks(idx, value) {
    setEditing(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mirrors: prev.mirrors.map((m, i) => {
          if (i !== idx) return m;
          let nextName = m.name;
          if (!m.manuallyNamed) {
            const firstLine = value.split(/\r?\n/).map(s => s.trim()).find(Boolean);
            if (firstLine) {
              try {
                nextName = new URL(firstLine).hostname.replace(/^www\./, '') || `Mirror ${idx + 1}`;
              } catch {
                nextName = `Mirror ${idx + 1}`;
              }
            } else {
              nextName = `Mirror ${idx + 1}`;
            }
          }
          return { ...m, name: nextName, linksText: value };
        }),
      };
    });
  }

  function addEditMirror() {
    setEditing(prev => prev && ({
      ...prev,
      mirrors: [
        ...prev.mirrors,
        { id: Date.now() + Math.random(), name: `Mirror ${prev.mirrors.length + 1}`, linksText: '', resolvedLinks: [], manuallyNamed: false },
      ],
    }));
  }

  function removeEditMirror(idx) {
    setEditing(prev => {
      if (!prev || prev.mirrors.length <= 1) return prev;
      return { ...prev, mirrors: prev.mirrors.filter((_, i) => i !== idx) };
    });
  }

  async function handleRecheckFilenames(containerId) {
    if (!containerId || !apiKey || recheckingId || getRecheckCooldownSeconds(containerId) > 0) return;
    setRecheckingId(containerId);
    if (editing?.id === containerId) setEditStatus({ text: t.rechecking, type: 'loading' });

    try {
      const res = await fetch(`/api/pearcrypt?id=${encodeURIComponent(containerId)}`, {
        method: 'PATCH',
        headers: { 'x-api-key': apiKey },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Filename recheck failed (${res.status})`);
      }

      const now = Date.now();
      setCooldownNow(now);
      setRecheckCooldowns(prev => ({ ...prev, [containerId]: now }));

      const updatedCount = Number(json?.updated || 0);
      const latestList = await fetchContainers();
      const refreshed = latestList.find(c => c.id === containerId);
      if (refreshed) {
        setEditing(prev => {
          if (!prev || prev.id !== containerId) return prev;
          return {
            ...prev,
            mirrors: prev.mirrors.map((m, idx) => {
              const match = (refreshed.mirrors || [])[idx];
              return match ? { ...m, resolvedLinks: match.links || [] } : m;
            }),
          };
        });
      }

      const doneMsg = updatedCount > 0 ? `${t.recheck_updated} ${updatedCount}` : t.recheck_none;
      if (editing?.id === containerId) {
        setEditStatus({ text: doneMsg, type: 'success' });
      } else {
        setListStatus({ text: doneMsg, type: 'success' });
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to recheck filenames.';
      if (editing?.id === containerId) setEditStatus({ text: errMsg, type: 'error' });
      else setListStatus({ text: errMsg, type: 'error' });
    } finally {
      setRecheckingId(null);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editing || !apiKey) return;

    let body;
    try {
      body = buildUpdateContainerPayload({
        title: editing.title,
        description: editing.description,
        isProtected: editing.isProtected,
        password: editing.password,
        mirrors: (editing.mirrors || []).map(m => ({ name: m.name, links: m.linksText })),
      });
    } catch (err) {
      setEditStatus({ text: err.message, type: 'error' });
      return;
    }

    setEditSaving(true);
    setEditStatus({ text: t.status_saving, type: 'loading' });

    try {
      const res = await fetch(`/api/pearcrypt?id=${encodeURIComponent(editing.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Failed to update container (${res.status})`);
      }
      setEditing(null);
      fetchContainers();
    } catch (err) {
      setEditStatus({ text: err.message || 'Update failed.', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  }

  // --- Delete Container (DELETE /api/pearcrypt?id=...) ---
  async function handleDeleteContainer(container) {
    if (!apiKey) return;
    if (!confirm(`${t.confirm_delete} "${container.title}"?`)) return;
    try {
      const res = await fetch(`/api/pearcrypt?id=${encodeURIComponent(container.id)}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Delete failed (${res.status})`);
      }
      setContainers(prev => prev.filter(c => c.id !== container.id));
      if (createdContainer?.id === container.id) setCreatedContainer(null);
    } catch (err) {
      setListStatus({ text: err.message || 'Failed to delete container.', type: 'error' });
    }
  }

  const missingKey = keyReady && !apiKey;
  const filteredContainers = searchQuery.trim()
    ? containers.filter(c =>
        (c.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (c.id || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : containers;
  const shownContainers = filteredContainers.slice(0, 10);

  return (
    <>
      <Header currentLang={lang} onLangChange={setLang} />
      <main id="main-content" className="main-layout">
        <div className="page-header">
          <h1 className="page-title">{dict.nav.pearcrypt}</h1>
          <a
            href="https://pearcrypt.lol/docs/api"
            target="_blank"
            rel="noreferrer"
            className="neo-btn neo-btn-subtle"
          >
            <IconExternal size={13} />
            {t.api_docs}
          </a>
        </div>

        {missingKey && (
          <div
            className="status-banner show error"
            style={{ marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
          >
            <span>{t.missing_key_banner}</span>
            <Link href="/account?tab=apikeys" className="neo-btn neo-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              {t.configure_btn}
            </Link>
          </div>
        )}

        <div className="content-grid">
          {/* ===== LEFT COLUMN: Create Container ===== */}
          <div className="form-column">
            <form onSubmit={handleCreateContainer}>
              <div className="neo-card">
                <div className="neo-card-header">
                  <span className="neo-card-title">
                    <IconLock size={14} />
                    {t.create_title}
                  </span>
                </div>
                <div className="neo-card-body">
                  <div className="form-field">
                    <label className="form-label">{t.f_title}</label>
                    <input
                      type="text"
                      placeholder={t.f_title_ph}
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      disabled={missingKey}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">{t.f_desc}</label>
                    <textarea
                      rows={2}
                      placeholder={t.f_desc_ph}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      disabled={missingKey}
                    />
                  </div>

                  <div className="form-field">
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={isProtected}
                        onChange={e => setIsProtected(e.target.checked)}
                        disabled={missingKey}
                      />
                      <span>{t.protect_label}</span>
                    </label>
                  </div>

                  {isProtected && (
                    <div className="form-field">
                      <label className="form-label">{t.f_password}</label>
                      <input
                        type="text"
                        className="mono"
                        placeholder={t.f_password_ph}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={missingKey}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mirrors & Links */}
              <div className="neo-card">
                <div className="neo-card-header">
                  <span className="neo-card-title">
                    {t.mirrors_title}
                  </span>
                  <button
                    type="button"
                    className="neo-btn neo-btn-subtle"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={addMirror}
                    disabled={missingKey}
                  >
                    <IconPlus size={12} />
                    {t.add_mirror}
                  </button>
                </div>
                <div className="neo-card-body">
                  <p className="field-hint" style={{ marginTop: 0, marginBottom: 14 }}>
                    {t.paste_tip}
                  </p>

                  {mirrors.map((mirror, mi) => (
                    <div
                      key={mirror.id}
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 14,
                        marginBottom: mi < mirrors.length - 1 ? 14 : 0,
                      }}
                    >
                      <div className="input-group" style={{ marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder={`Mirror ${mi + 1} (Pixeldrain, GoFile, Buzzheavier...)`}
                          value={mirror.name}
                          onChange={e => updateMirrorName(mi, e.target.value)}
                          disabled={missingKey}
                        />
                        <button
                          type="button"
                          className="neo-btn neo-btn-subtle"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => addLink(mi)}
                          disabled={missingKey}
                        >
                          <IconPlus size={12} />
                          {t.add_link}
                        </button>
                        {mirrors.length > 1 && (
                          <button
                            type="button"
                            className="neo-btn neo-btn-danger"
                            style={{ padding: '6px 10px' }}
                            onClick={() => removeMirror(mi)}
                            disabled={missingKey}
                            aria-label={`Remove mirror ${mi + 1}`}
                          >
                            <IconTrash size={13} />
                          </button>
                        )}
                      </div>

                      {mirror.links.map((link, li) => (
                        <div key={link.id} className="pearcrypt-link-row">
                          <input
                            type="url"
                            className="mono"
                            placeholder="https://..."
                            value={link.url}
                            onChange={e => updateLinkUrl(mi, li, e.target.value)}
                            onPaste={e => handleUrlPaste(e, mi, li)}
                            disabled={missingKey}
                          />
                          <button
                            type="button"
                            className="neo-btn neo-btn-danger"
                            style={{ padding: '8px 10px' }}
                            onClick={() => removeLink(mi, li)}
                            disabled={missingKey}
                            aria-label="Remove link"
                          >
                            <IconClose size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="actions-bar">
                <button
                  type="submit"
                  className="neo-btn neo-btn-primary"
                  disabled={missingKey || creating}
                >
                  <IconLock size={14} />
                  {creating ? t.creating : t.create_btn}
                </button>
                <button
                  type="button"
                  className="neo-btn neo-btn-subtle"
                  onClick={resetCreateForm}
                  disabled={creating}
                >
                  {t.clear_btn}
                </button>
              </div>

              {formStatus.text && (
                <div className={`status-banner show ${formStatus.type}`}>
                  {formStatus.text}
                </div>
              )}

              {createdContainer && (
                <div className="neo-card highlight" style={{ marginTop: 16 }}>
                  <div className="neo-card-header">
                    <span className="neo-card-title">
                      {t.created_ready}
                    </span>
                  </div>
                  <div className="neo-card-body">
                    <div className="form-field">
                      <label className="form-label">{t.share_url}</label>
                      <input
                        type="text"
                        readOnly
                        className="mono"
                        value={getContainerShareUrl(createdContainer)}
                      />
                    </div>
                    <div className="actions-bar" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="neo-btn neo-btn-primary"
                        style={{ padding: '6px 12px', fontSize: 11 }}
                        onClick={() => copyText(getContainerShareUrl(createdContainer), 'created-url')}
                      >
                        {copiedKey === 'created-url' ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        {copiedKey === 'created-url' ? t.copied_url : t.copy_url}
                      </button>
                      <button
                        type="button"
                        className="neo-btn neo-btn-subtle"
                        style={{ padding: '6px 12px', fontSize: 11 }}
                        onClick={() => copyText(makeBBCodeLink(createdContainer), 'created-bb')}
                      >
                        {copiedKey === 'created-bb' ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        {copiedKey === 'created-bb' ? t.copied_bbcode : t.copy_bbcode}
                      </button>
                      <a
                        href={getContainerShareUrl(createdContainer)}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-btn neo-btn-subtle"
                        style={{ padding: '6px 12px', fontSize: 11 }}
                      >
                        <IconExternal size={12} />
                        {t.open}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ===== RIGHT COLUMN: Containers List ===== */}
          <div className="output-column">
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.your_containers} ({filteredContainers.length > 10 ? `${shownContainers.length}/${filteredContainers.length}` : filteredContainers.length})
                </span>
                <button
                  type="button"
                  className="neo-btn neo-btn-subtle"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={() => fetchContainers()}
                  disabled={missingKey || loadingList}
                >
                  <IconRefresh size={12} />
                  {loadingList ? t.loading : t.refresh}
                </button>
              </div>
              <div className="neo-card-body">
                {listStatus.text && (
                  <div className={`status-banner show ${listStatus.type}`} style={{ marginTop: 0, marginBottom: 14 }}>
                    {listStatus.text}
                  </div>
                )}

                {apiKey && containers.length > 0 && (
                  <div className="form-field" style={{ marginBottom: 14 }}>
                    <input
                      type="text"
                      placeholder={t.search_ph}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}

                {!apiKey ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, color: 'var(--text-dim)' }}>
                      {t.key_required_title}
                    </p>
                    <p className="field-hint" style={{ marginTop: 6 }}>
                      {t.key_required_hint_pre}
                      <Link href="/account?tab=apikeys" style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}>{t.key_required_hint_link}</Link>
                      {t.key_required_hint_post}
                    </p>
                  </div>
                ) : loadingList && containers.length === 0 ? (
                  <p className="field-hint" style={{ textAlign: 'center', padding: '32px 0' }}>
                    {t.loading_containers}
                  </p>
                ) : filteredContainers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, color: 'var(--text-dim)' }}>
                      {searchQuery.trim() ? t.no_matches : t.no_containers}
                    </p>
                    <p className="field-hint" style={{ marginTop: 6 }}>
                      {searchQuery.trim() ? t.try_different : t.create_first}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {shownContainers.map(c => {
                      const shareUrl = getContainerShareUrl(c);
                      const mirrorCount = Array.isArray(c.mirrors) ? c.mirrors.length : 0;
                      const linkCount = Array.isArray(c.mirrors)
                        ? c.mirrors.reduce((acc, m) => acc + (m.links?.length || 0), 0)
                        : 0;
                      const isExpanded = expandedId === c.id;

                      return (
                        <div key={c.id} className="saved-card">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div className="saved-card-title" style={{ marginBottom: 2 }}>
                                {c.title}
                              </div>
                              {c.is_protected && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: 4,
                                    background: 'var(--accent-soft)',
                                    border: '1px solid var(--accent-border)',
                                    color: 'var(--accent-soft-text)',
                                    fontFamily: 'var(--font-display)',
                                  }}
                                >
                                  <IconLock size={11} />
                                  {t.locked}
                                </span>
                              )}
                            </div>

                            {c.description && (
                              <p className="field-hint" style={{ marginTop: 2, marginBottom: 6, color: 'var(--text-dim)' }}>
                                {c.description}
                              </p>
                            )}

                            <div className="saved-card-date" style={{ marginBottom: 8 }}>
                              {mirrorCount} {mirrorCount === 1 ? t.mirror_one : t.mirror_many} &middot; {linkCount} {linkCount === 1 ? t.link_one : t.link_many}
                              {typeof c.view_count === 'number' ? ` · ${c.view_count} ${t.views}` : ''}
                              {c.updated_at ? ` · ${new Date(c.updated_at).toLocaleDateString()}` : ''}
                            </div>

                            <div className="mono" style={{ fontSize: 11.5, color: 'var(--accent-text)', wordBreak: 'break-all', marginBottom: 10 }}>
                              {shareUrl}
                            </div>

                            {isExpanded && (
                              <div
                                style={{
                                  background: 'var(--input-bg)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 4,
                                  padding: 10,
                                  marginBottom: 10,
                                }}
                              >
                                {Array.isArray(c.mirrors) && c.mirrors.length > 0 ? (
                                  c.mirrors.map((m, idx) => (
                                    <div key={m.id || idx} style={{ marginBottom: idx < c.mirrors.length - 1 ? 8 : 0 }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-white)', marginBottom: 4 }}>
                                        {m.name} ({m.links?.length || 0})
                                      </div>
                                      {(m.links || []).map((l, li) => (
                                        <div key={l.id || li} className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                                          &bull; {l.file_name ? `${l.file_name} ` : ''}{l.file_size ? `(${l.file_size}) ` : ''}{l.url}
                                        </div>
                                      ))}
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    0 {t.mirror_many}
                                  </div>
                                )}
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="neo-btn neo-btn-subtle"
                                    style={{ padding: '4px 10px', fontSize: 11 }}
                                    onClick={() => handleRecheckFilenames(c.id)}
                                    disabled={recheckingId === c.id || getRecheckCooldownSeconds(c.id) > 0}
                                  >
                                    <IconRefresh size={12} />
                                    {recheckingId === c.id
                                      ? t.rechecking
                                      : getRecheckCooldownSeconds(c.id) > 0
                                        ? `${getRecheckCooldownSeconds(c.id)}s`
                                        : t.recheck_btn}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="saved-card-actions" style={{ flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="neo-btn neo-btn-primary"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => copyText(shareUrl, `url-${c.id}`)}
                            >
                              {copiedKey === `url-${c.id}` ? <IconCheck size={12} /> : <IconCopy size={12} />}
                              {copiedKey === `url-${c.id}` ? t.copied : t.copy_link}
                            </button>
                            <button
                              type="button"
                              className="neo-btn neo-btn-subtle"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => copyText(makeBBCodeLink(c), `bb-${c.id}`)}
                            >
                              {copiedKey === `bb-${c.id}` ? <IconCheck size={12} /> : <IconCopy size={12} />}
                              {copiedKey === `bb-${c.id}` ? t.copied : t.bbcode}
                            </button>
                            <button
                              type="button"
                              className="neo-btn neo-btn-subtle"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            >
                              {isExpanded ? t.hide : t.mirrors}
                            </button>
                            <button
                              type="button"
                              className="neo-btn neo-btn-subtle"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => openEditModal(c)}
                            >
                              {t.edit}
                            </button>
                            <a
                              href={shareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="neo-btn neo-btn-subtle"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                              aria-label={`${t.open} ${c.title}`}
                              title={t.open}
                            >
                              <IconExternal size={12} />
                            </a>
                            <button
                              type="button"
                              className="neo-btn neo-btn-danger"
                              style={{ padding: '4px 8px', fontSize: 12, marginLeft: 'auto' }}
                              onClick={() => handleDeleteContainer(c)}
                              aria-label={`Delete ${c.title}`}
                            >
                              <IconTrash size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== Edit Container Modal ===== */}
      {editing && (
        <div className="neo-modal-backdrop" onClick={() => setEditing(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.edit_modal_title}
            className="neo-modal-box neo-modal-wide"
            onClick={e => e.stopPropagation()}
          >
            <div className="neo-modal-head">
              <span className="neo-modal-title">{t.edit_modal_title}</span>
              <button
                type="button"
                className="neo-btn neo-btn-subtle"
                style={{ padding: '4px 8px', minHeight: 34 }}
                onClick={() => setEditing(null)}
                aria-label={t.cancel}
              >
                <IconClose size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="neo-modal-body">
              <div className="form-field">
                <label htmlFor="edit-container-title" className="form-label">{t.edit_title}</label>
                <input
                  id="edit-container-title"
                  type="text"
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="edit-container-desc" className="form-label">{t.edit_desc}</label>
                <textarea
                  id="edit-container-desc"
                  rows={2}
                  value={editing.description}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={editing.isProtected}
                    onChange={e => setEditing({ ...editing, isProtected: e.target.checked })}
                  />
                  <span>{t.edit_protected}</span>
                </label>
              </div>
              {editing.isProtected && (
                <div className="form-field">
                  <label htmlFor="edit-container-pw" className="form-label">{t.edit_new_pw}</label>
                  <input
                    id="edit-container-pw"
                    type="text"
                    className="mono"
                    placeholder={t.edit_new_pw_ph}
                    value={editing.password}
                    onChange={e => setEditing({ ...editing, password: e.target.value })}
                  />
                </div>
              )}

              {/* Mirrors & Recheck Filenames */}
              <div className="form-field" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <span className="form-label" style={{ marginBottom: 0 }}>{t.edit_mirrors}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="neo-btn neo-btn-subtle"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => handleRecheckFilenames(editing.id)}
                      disabled={recheckingId === editing.id || getRecheckCooldownSeconds(editing.id) > 0}
                    >
                      <IconRefresh size={12} />
                      {recheckingId === editing.id
                        ? t.rechecking
                        : getRecheckCooldownSeconds(editing.id) > 0
                          ? `${getRecheckCooldownSeconds(editing.id)}s`
                          : t.recheck_btn}
                    </button>
                    <button
                      type="button"
                      className="neo-btn neo-btn-subtle"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={addEditMirror}
                    >
                      <IconPlus size={12} />
                      {t.add_mirror}
                    </button>
                  </div>
                </div>

                {(editing.mirrors || []).map((m, mi) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 12,
                      marginBottom: mi < editing.mirrors.length - 1 ? 12 : 0,
                    }}
                  >
                    <div className="input-group" style={{ marginBottom: 8 }}>
                      <input
                        type="text"
                        aria-label={`${t.edit_mirrors} ${mi + 1}`}
                        value={m.name}
                        onChange={e => updateEditMirrorName(mi, e.target.value)}
                      />
                      {editing.mirrors.length > 1 && (
                        <button
                          type="button"
                          className="neo-btn neo-btn-danger"
                          style={{ padding: '6px 10px' }}
                          onClick={() => removeEditMirror(mi)}
                          aria-label={`Remove mirror ${mi + 1}`}
                        >
                          <IconTrash size={13} />
                        </button>
                      )}
                    </div>

                    <label htmlFor={`edit-mirror-links-${mi}`} className="form-label" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                      {t.edit_links_label}
                    </label>
                    <textarea
                      id={`edit-mirror-links-${mi}`}
                      rows={4}
                      className="mono"
                      placeholder="https://..."
                      value={m.linksText}
                      onChange={e => updateEditMirrorLinks(mi, e.target.value)}
                    />
                    <p className="field-hint" style={{ marginTop: 4 }}>{t.edit_links_hint}</p>

                    {Array.isArray(m.resolvedLinks) && m.resolvedLinks.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          borderRadius: 4,
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>
                          {t.resolved_files} ({m.resolvedLinks.length})
                        </div>
                        {m.resolvedLinks.map((lnk, li) => (
                          <div key={lnk.id || li} className="mono" style={{ fontSize: 11, color: lnk.file_name ? 'var(--text)' : 'var(--text-muted)', wordBreak: 'break-all' }}>
                            &bull; {lnk.file_name || t.pending_filename}{lnk.file_size ? ` (${lnk.file_size})` : ''}{lnk.host_name ? ` · ${lnk.host_name}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {editStatus.text && (
                <div className={`status-banner show ${editStatus.type}`} style={{ marginBottom: 12 }}>
                  {editStatus.text}
                </div>
              )}

              <div className="actions-bar">
                <button type="submit" className="neo-btn neo-btn-primary" disabled={editSaving}>
                  <IconSave size={14} />
                  {editSaving ? t.saving : t.save_changes}
                </button>
                <button type="button" className="neo-btn neo-btn-subtle" onClick={() => setEditing(null)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
