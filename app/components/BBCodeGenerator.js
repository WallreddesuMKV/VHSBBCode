'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserSupabase } from '../utils/supabaseClient';
import Header from './Header';
import Link from 'next/link';
import {
  IconUpload,
  IconCopy,
  IconSave,
  IconCheck,
  IconPlus,
  IconClose,
  IconPreview,
  IconSteam,
  IconGOG,
  IconEpic,
  IconItch,
  IconMovie
} from './Icons';
import {
  fetchSteamData,
  fetchGogData,
  fetchEpicData,
  fetchItchData,
  fetchImdbData
} from '../utils/fetchMetadata';
import { generateGameBBCode, generateMovieBBCode } from '../utils/generateBBCode';
import { copyToClipboard } from '../utils/clipboard';
import { useLang } from '../utils/useLang';

const blankForm = {
  appid: '', gogUrl: '', epicUrl: '', itchUrl: '',
  title: '', headerImg: '', quote: '', imgboxUrl: '',
  releaseDate: '', languages: '', genre: '', developer: '', publisher: '',
  buildId: '', buildName: '', version: '', includedContent: '', storeUrl: '',
  sourceCrack: '', repackSize: '', finalSize: '', ramRequired: '',
  duration: '', imdbUrl: '',
  resolution: '', color: '', frameRate: '',
  noteText: '', noteLinkUrl: '', noteEnabled: false
};

const gameSampleData = {
  ...blankForm,
  appid: '3500390',
  title: 'Mega Man Star Force Legacy Collection',
  headerImg: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3500390/81670785247923be3f05dad43452f84c6ec974ea/header.jpg?t=1788912796',
  quote: 'The Mega Man Star Force series, which expanded into an anime, is back in the Mega Man Star Force Legacy Collection! This collection includes seven games and additional features like a gallery of illustrations and music! Online play is also supported!',
  imgboxUrl: 'https://img.ptscreens.com/3500390_VHSTaPE.png',
  releaseDate: '26 Mar, 2026',
  genre: 'Action, RPG, Strategy',
  developer: 'CAPCOM Co., Ltd.',
  publisher: 'CAPCOM Co., Ltd.',
  buildId: '23297979',
  buildName: 'Mega Man Star Force Legacy Collection',
  languages: 'MULTi4',
  includedContent: 'MMSFC Game Launch Entitlement DLC\nMega Man Star Force Legacy Collection – Sonia Strumm and Luna Platz Character Model Pack\nMega Man Star Force Legacy Collection – Mega Man Battle Network Series BGM\nMega Man Star Force Legacy Collection – Geo Stelar and Omega-Xis Character Model Pack\nMEGAMAN STAR FORCE Legacy Collection Original Soundtrack',
  sourceCrack: 'TENOKE',
  repackSize: '5.83 GB',
  finalSize: '7.65 GB',
  ramRequired: '4 GB during installation',
  storeUrl: 'https://store.steampowered.com/app/3500390/Mega_Man_Star_Force_Legacy_Collection/',
  noteText: "[color=#BF0000][b]ACHTUNG!![/b][/color]\r\nCheck the repack size before downloading, a real repack ain't gonna be some small mb file",
  noteLinkUrl: 'https://www.reddit.com/r/CrackSupport/s/swutlZ210',
  noteEnabled: true,
  links: [
    { id: 1, text: 'Main Links (Filecrypt)', url: 'https://ouo.io/xSRNXKA' },
    { id: 2, text: 'Mirror (Pearcrypt)', url: 'https://ouo.io/JYmuYI' }
  ]
};

const movieSampleData = {
  ...blankForm,
  imdbUrl: 'https://www.imdb.com/title/tt43739386/',
  title: 'V/H/S MIXTAPE',
  headerImg: 'https://img.ptscreens.com/vhsmixtape_header.jpg',
  quote: 'It presents a new anthology in which music and sound become a source of terror.',
  imgboxUrl: 'https://img.ptscreens.com/V.H.S.MIXTAPE.2026-VHSTaPE.png',
  buildName: 'Kitsune/AMZN',
  releaseDate: '2026',
  genre: 'Horror',
  languages: 'MULTi3',
  sourceCrack: 'AMZN',
  repackSize: '1.45 GB',
  resolution: '1080p',
  color: 'BT709',
  frameRate: '24 fps',
  duration: '1 h 38 m',
  storeUrl: 'https://www.imdb.com/title/tt43739386/',
  noteText: "[color=#BF0000][b]ACHTUNG!![/b][/color]\r\nCheck the repack size before downloading, a real repack ain't gonna be some small mb file",
  noteLinkUrl: 'https://www.reddit.com/r/CrackSupport/s/swutlZ210',
  noteEnabled: true,
  links: [
    { id: 1, text: 'Main Links (Filecrypt)', url: '#' },
    { id: 2, text: 'Mirror (Pearcrypt)', url: '#' }
  ]
};

export default function BBCodeGenerator({ mode = 'game' }) {
  const isMovie = mode === 'movie';
  const defaultSample = isMovie ? movieSampleData : gameSampleData;

  const { lang, setLang, dict } = useLang();
  const [source, setSource] = useState(isMovie ? 'imdb' : 'steam');
  const [form, setForm] = useState(defaultSample);
  const [links, setLinks] = useState(defaultSample.links);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState({ text: '', type: '' });
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [user, setUser] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Per-User Isolated API Keys
  const [apiKeys, setApiKeys] = useState({
    ptscreens: '',
    imgbb: '',
    pearcrypt: '',
    defaultUploader: 'ptscreens'
  });

  // Uploader Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetField, setUploadTargetField] = useState('imgboxUrl');
  const [uploadHost, setUploadHost] = useState('ptscreens');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ text: '', type: '' });
  const [uploadedResultUrl, setUploadedResultUrl] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const t = dict.gen;

  useEffect(() => {
    // Load saved BBCode only if it matches this generator mode
    const pendingLoad = localStorage.getItem('bbcode_load_pending');
    if (pendingLoad) {
      try {
        const parsed = JSON.parse(pendingLoad);
        const pendingIsMovie = parsed.source === 'imdb';
        if (pendingIsMovie === isMovie) {
          setForm({ ...blankForm, ...parsed });
          if (parsed.links) setLinks(parsed.links);
          if (!isMovie && parsed.source && parsed.source !== 'imdb') setSource(parsed.source);
          localStorage.removeItem('bbcode_load_pending');
          setSaveStatus(t.load_success);
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } catch (e) { }
    }

    // Load API keys for current session
    const active = localStorage.getItem('bbcode_api_keys_active');
    const guest = localStorage.getItem('bbcode_api_keys_guest');
    const raw = active || guest;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setApiKeys(parsed);
        if (parsed.defaultUploader) setUploadHost(parsed.defaultUploader);
      } catch (e) { }
    }

    // Supabase Auth Check
    const client = createBrowserSupabase();
    if (client) {
      try {
        setSupabaseClient(client);

        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) handleUserAuth(client, session.user);
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) handleUserAuth(client, session.user);
          else setUser(null);
        });

        return () => subscription.unsubscribe();
      } catch (e) { }
    }
  }, [isMovie, t.load_success]);

  async function handleUserAuth(client, authUser) {
    const u = {
      id: authUser.id,
      username: authUser.user_metadata?.custom_claims?.global_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.user_name ||
        authUser.email || 'Discord User',
      avatar: authUser.user_metadata?.avatar_url || '',
      discord_id: authUser.user_metadata?.provider_id || authUser.id
    };
    setUser(u);

    const cached = localStorage.getItem(`bbcode_api_keys_${u.id}`) ||
      localStorage.getItem('bbcode_api_keys_active') ||
      localStorage.getItem('bbcode_api_keys_guest');
    let cachedParsed = null;
    if (cached) {
      try { cachedParsed = JSON.parse(cached); } catch (e) { }
    }

    let cloudKeys = null;
    try {
      const { data, error } = await client
        .from('user_api_keys')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle();

      if (!error && data && (data.ptscreens_api_key || data.imgbb_api_key || data.pearcrypt_api_key)) {
        cloudKeys = {
          ptscreens: data.ptscreens_api_key || data.ptscreens_key || '',
          imgbb: data.imgbb_api_key || data.imgbb_key || '',
          pearcrypt: (data.pearcrypt_api_key || '').trim() || (cachedParsed?.pearcrypt || '').trim() || '',
          defaultUploader: data.default_uploader || 'ptscreens'
        };
      }
    } catch (e) {
      console.warn('Error fetching keys from Supabase:', e);
    }

    if (cloudKeys) {
      setApiKeys(cloudKeys);
      if (cloudKeys.defaultUploader) setUploadHost(cloudKeys.defaultUploader);
      localStorage.setItem(`bbcode_api_keys_${u.id}`, JSON.stringify(cloudKeys));
      localStorage.setItem('bbcode_api_keys_active', JSON.stringify(cloudKeys));
      return;
    }

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
          if (keysToSync.defaultUploader) setUploadHost(keysToSync.defaultUploader);
          localStorage.setItem(`bbcode_api_keys_${u.id}`, JSON.stringify(keysToSync));
          localStorage.setItem('bbcode_api_keys_active', JSON.stringify(keysToSync));

          await client.from('user_api_keys').upsert({
            user_id: u.id,
            ptscreens_api_key: keysToSync.ptscreens,
            imgbb_api_key: keysToSync.imgbb,
            pearcrypt_api_key: keysToSync.pearcrypt,
            default_uploader: keysToSync.defaultUploader,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
      } catch (e) {
        console.warn('Error syncing cached keys in handleUserAuth:', e);
      }
    }
  }

  function updateFormField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const generateBBCode = useCallback(() => {
    return isMovie
      ? generateMovieBBCode(form, links)
      : generateGameBBCode(form, links, source);
  }, [form, links, source, isMovie]);

  const outputBBCode = generateBBCode();

  useEffect(() => {
    if (outputBBCode) {
      localStorage.setItem('bbcode_active_output', outputBBCode);
    }
  }, [outputBBCode]);

  useEffect(() => {
    if (!showUploadModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowUploadModal(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showUploadModal]);

  // --- Game Store Fetch Handlers ---
  async function handleSteamFetch() {
    const appid = form.appid.trim();
    if (!appid) {
      setFetchStatus({ text: 'Please enter a numeric Steam App ID.', type: 'error' });
      return;
    }
    setFetching(true);
    setFetchStatus({ text: 'Fetching from Steam API...', type: 'loading' });

    try {
      const data = await fetchSteamData(appid, (msg, type) => setFetchStatus({ text: msg, type }));
      setForm(prev => ({
        ...prev,
        title: data.title || '',
        headerImg: data.headerImg || '',
        quote: data.quote || '',
        releaseDate: data.releaseDate || '',
        developer: data.developer || '',
        publisher: data.publisher || '',
        genre: data.genre || '',
        storeUrl: data.storeUrl || '',
        languages: data.languages || '',
        buildId: data.buildId || '',
        buildName: data.buildName || data.title || '',
        version: '',
        includedContent: data.includedContent || ''
      }));
      setSource('steam');
      setFetchStatus({
        text: data.buildId ? `Success! Steam data fetched. Build ID: ${data.buildId}` : 'Success! Steam data fetched.',
        type: 'success'
      });
    } catch (err) {
      setFetchStatus({ text: err.message || 'Failed to fetch Steam data.', type: 'error' });
    } finally {
      setFetching(false);
    }
  }

  async function handleGogFetch() {
    const input = form.gogUrl.trim();
    if (!input) {
      setFetchStatus({ text: 'Please enter a GOG URL or product ID.', type: 'error' });
      return;
    }
    setFetching(true);
    setFetchStatus({ text: 'Fetching from GOG...', type: 'loading' });

    try {
      const data = await fetchGogData(input, (msg, type) => setFetchStatus({ text: msg, type }));
      setForm(prev => ({
        ...prev,
        title: data.title || '',
        headerImg: data.headerImg || '',
        quote: data.quote || '',
        developer: data.developer || '',
        publisher: data.publisher || '',
        genre: data.genre || '',
        releaseDate: data.releaseDate || '',
        languages: data.languages || '',
        storeUrl: data.storeUrl || '',
        buildName: data.title || '',
        buildId: '',
        version: '',
        includedContent: data.includedContent || ''
      }));
      setSource('gog');
      setFetchStatus({ text: 'Success! GOG data fetched.', type: 'success' });
    } catch (err) {
      setFetchStatus({ text: err.message || 'Failed to fetch GOG data.', type: 'error' });
    } finally {
      setFetching(false);
    }
  }

  async function handleEpicFetch() {
    const input = form.epicUrl.trim();
    if (!input) {
      setFetchStatus({ text: 'Please enter an Epic Games URL or slug.', type: 'error' });
      return;
    }
    setFetching(true);
    setFetchStatus({ text: 'Fetching from Epic Games Store...', type: 'loading' });

    try {
      const data = await fetchEpicData(input, (msg, type) => setFetchStatus({ text: msg, type }));
      setForm(prev => ({
        ...prev,
        title: data.title || '',
        headerImg: data.headerImg || '',
        quote: data.quote || '',
        releaseDate: data.releaseDate || '',
        genre: data.genre || '',
        developer: data.developer || '',
        publisher: data.publisher || '',
        languages: data.languages || '',
        storeUrl: data.storeUrl || '',
        buildName: data.title || '',
        buildId: '',
        version: '',
        includedContent: data.includedContent || ''
      }));
      setSource('epic');
      setFetchStatus({ text: 'Success! Epic Games Store data fetched.', type: 'success' });
    } catch (err) {
      setFetchStatus({ text: err.message || 'Failed to fetch Epic Games data.', type: 'error' });
    } finally {
      setFetching(false);
    }
  }

  async function handleItchFetch() {
    const input = form.itchUrl.trim();
    if (!input) {
      setFetchStatus({ text: 'Please enter an itch.io URL.', type: 'error' });
      return;
    }
    setFetching(true);
    setFetchStatus({ text: 'Fetching from itch.io...', type: 'loading' });

    try {
      const data = await fetchItchData(input, (msg, type) => setFetchStatus({ text: msg, type }));
      setForm(prev => ({
        ...prev,
        title: data.title || '',
        headerImg: data.headerImg || '',
        quote: data.quote || '',
        releaseDate: data.releaseDate || '',
        genre: data.genre || '',
        developer: data.developer || '',
        publisher: data.publisher || '',
        languages: data.languages || '',
        version: data.version || '',
        storeUrl: data.storeUrl || '',
        buildName: data.title || '',
        buildId: '',
        includedContent: ''
      }));
      setSource('itch');
      setFetchStatus({ text: 'Success! itch.io data fetched.', type: 'success' });
    } catch (err) {
      setFetchStatus({ text: err.message || 'Failed to fetch itch.io data.', type: 'error' });
    } finally {
      setFetching(false);
    }
  }

  // --- IMDb Movie Fetch Handler ---
  async function handleImdbFetch() {
    const input = form.imdbUrl.trim();
    if (!input) {
      setFetchStatus({ text: 'Please enter an IMDb URL or title ID.', type: 'error' });
      return;
    }
    setFetching(true);
    setFetchStatus({ text: 'Fetching from IMDb...', type: 'loading' });
    try {
      const data = await fetchImdbData(input, (msg, type) => setFetchStatus({ text: msg, type }));
      setForm(prev => ({
        ...prev,
        title: data.title || '',
        headerImg: data.headerImg || '',
        quote: data.quote || '',
        genre: data.genre || '',
        duration: data.duration || '',
        languages: data.languages || '',
        imdbUrl: data.imdbUrl || '',
        releaseDate: data.releaseDate ? String(data.releaseDate).slice(0, 4) : '',
        storeUrl: data.imdbUrl || '',
        buildName: data.title || ''
      }));
      setFetchStatus({ text: 'Success! IMDb data fetched.', type: 'success' });
    } catch (err) {
      setFetchStatus({ text: err.message || 'Failed to fetch IMDb data.', type: 'error' });
    } finally {
      setFetching(false);
    }
  }

  // --- Copy BBCode ---
  async function handleCopy() {
    if (!outputBBCode) return;
    if (await copyToClipboard(outputBBCode)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // --- Save BBCode to Cloud / Local ---
  async function handleSaveBBCode() {
    if (!form.title) {
      alert('Please provide a Title before saving.');
      return;
    }

    const activeSource = isMovie ? 'imdb' : source;
    const payload = {
      id: Date.now().toString(),
      title: form.title,
      bbcode: outputBBCode,
      form_data: { ...form, links, source: activeSource },
      updated_at: new Date().toISOString()
    };

    if (supabaseClient && user) {
      try {
        const { error } = await supabaseClient.from('saved_bbcodes').upsert({
          user_id: user.id,
          title: form.title,
          bbcode: outputBBCode,
          form_data: { ...form, links, source: activeSource },
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
        setSaveStatus(t.save_success);
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      } catch (err) {
        console.warn('Cloud save fallback to local:', err);
      }
    }

    const existing = JSON.parse(localStorage.getItem('saved_bbcodes_local') || '[]');
    const filtered = existing.filter(x => x.title !== form.title);
    filtered.unshift(payload);
    localStorage.setItem('saved_bbcodes_local', JSON.stringify(filtered));
    setSaveStatus(t.save_success);
    setTimeout(() => setSaveStatus(''), 3000);
  }

  // --- Clear & Example ---
  function handleClear() {
    setForm(blankForm);
    setLinks([{ id: 1, text: '', url: '' }]);
  }

  function handleLoadExample() {
    if (isMovie) {
      setForm(movieSampleData);
      setLinks(movieSampleData.links);
    } else {
      setSource('steam');
      setForm(gameSampleData);
      setLinks(gameSampleData.links);
    }
  }

  // --- Image Uploader ---
  function openUploader(target = 'imgboxUrl') {
    setUploadTargetField(target);
    setUploadStatus({ text: '', type: '' });
    setUploadedResultUrl('');
    setUploadPreview(null);
    setShowUploadModal(true);
  }

  async function handleImageUpload(file) {
    if (!file) return;
    setUploading(true);
    setUploadStatus({ text: 'Uploading image to host...', type: 'loading' });

    const key = uploadHost === 'ptscreens' ? apiKeys.ptscreens : apiKeys.imgbb;
    if (!key) {
      setUploading(false);
      setUploadStatus({
        text: `Missing ${uploadHost === 'ptscreens' ? 'PTScreens' : 'ImgBB'} key. Configure in Account.`,
        type: 'error'
      });
      return;
    }

    try {
      const endpoint = uploadHost === 'ptscreens' ? '/api/upload/ptscreens' : '/api/upload/imgbb';
      const fd = new FormData();
      fd.append('file', file);
      fd.append('apiKey', key);

      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed.');
      }

      const returnedUrl = data.url;
      setUploadedResultUrl(returnedUrl);
      setUploadStatus({ text: 'Image uploaded successfully.', type: 'success' });
      updateFormField(uploadTargetField, returnedUrl);
    } catch (err) {
      setUploadStatus({ text: err.message || 'Upload error.', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploadPreview(URL.createObjectURL(file));
          handleImageUpload(file);
          break;
        }
      }
    }
  }

  return (
    <>
      <Header currentLang={lang} onLangChange={setLang} />
      <main id="main-content" className="main-layout">
        <div className="page-header">
          <div>
            <h1 className="page-title">{isMovie ? dict.nav.movies : dict.nav.games}</h1>
            <p className="page-subtitle">{isMovie ? 'IMDb' : 'Steam, GOG, Epic, itch.io'}</p>
          </div>
        </div>
        <div className="content-grid">
          {/* ===== LEFT COLUMN: Form Controls ===== */}
          <div className="form-column">
            {/* Metadata Source Card */}
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {isMovie ? (
                    <>
                      <IconMovie size={15} />
                      {t.imdb_source}
                    </>
                  ) : (
                    t.metadata_source
                  )}
                </span>
              </div>
              <div className="neo-card-body">
                {isMovie ? (
                  <div>
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Paste IMDb URL or title ID (e.g. tt43739386)"
                        className="mono"
                        value={form.imdbUrl}
                        onChange={e => updateFormField('imdbUrl', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleImdbFetch()}
                      />
                      <button className="neo-btn neo-btn-primary" onClick={handleImdbFetch} disabled={fetching}>
                        {fetching ? t.fetching : t.imdb_fetch}
                      </button>
                    </div>
                    <p className="field-hint">{t.imdb_hint}</p>
                  </div>
                ) : (
                  <>
                    <div className="source-switch">
                      <button
                        className={`source-btn ${source === 'steam' ? 'active' : ''}`}
                        onClick={() => setSource('steam')}
                      >
                        <IconSteam size={15} />
                        <span>{t.source_steam}</span>
                      </button>
                      <button
                        className={`source-btn ${source === 'gog' ? 'active' : ''}`}
                        onClick={() => setSource('gog')}
                      >
                        <IconGOG size={15} />
                        <span>{t.source_gog}</span>
                      </button>
                      <button
                        className={`source-btn ${source === 'epic' ? 'active' : ''}`}
                        onClick={() => setSource('epic')}
                      >
                        <IconEpic size={15} />
                        <span>{t.source_epic}</span>
                      </button>
                      <button
                        className={`source-btn ${source === 'itch' ? 'active' : ''}`}
                        onClick={() => setSource('itch')}
                      >
                        <IconItch size={15} />
                        <span>{t.source_itch}</span>
                      </button>
                    </div>

                    {source === 'steam' && (
                      <div>
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Steam App ID or Store URL (e.g. 3500390)"
                            className="mono"
                            value={form.appid}
                            onChange={e => updateFormField('appid', e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSteamFetch()}
                          />
                          <button className="neo-btn neo-btn-primary" onClick={handleSteamFetch} disabled={fetching}>
                            {fetching ? t.fetching : t.steam_fetch}
                          </button>
                        </div>
                        <p className="field-hint">{t.steam_hint}</p>
                      </div>
                    )}

                    {source === 'gog' && (
                      <div>
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Paste GOG game URL or product slug"
                            className="mono"
                            value={form.gogUrl}
                            onChange={e => updateFormField('gogUrl', e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGogFetch()}
                          />
                          <button className="neo-btn neo-btn-primary" onClick={handleGogFetch} disabled={fetching}>
                            {fetching ? t.fetching : t.gog_fetch}
                          </button>
                        </div>
                        <p className="field-hint">{t.gog_hint}</p>
                      </div>
                    )}

                    {source === 'epic' && (
                      <div>
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Paste Epic Games Store URL or slug"
                            className="mono"
                            value={form.epicUrl}
                            onChange={e => updateFormField('epicUrl', e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEpicFetch()}
                          />
                          <button className="neo-btn neo-btn-primary" onClick={handleEpicFetch} disabled={fetching}>
                            {fetching ? t.fetching : t.epic_fetch}
                          </button>
                        </div>
                        <p className="field-hint">{t.epic_hint}</p>
                      </div>
                    )}

                    {source === 'itch' && (
                      <div>
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Paste itch.io game page URL"
                            className="mono"
                            value={form.itchUrl}
                            onChange={e => updateFormField('itchUrl', e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleItchFetch()}
                          />
                          <button className="neo-btn neo-btn-primary" onClick={handleItchFetch} disabled={fetching}>
                            {fetching ? t.fetching : t.itch_fetch}
                          </button>
                        </div>
                        <p className="field-hint">{t.itch_hint}</p>
                      </div>
                    )}
                  </>
                )}

                {fetchStatus.text && (
                  <div className={`status-banner show ${fetchStatus.type === 'error' ? 'error' : fetchStatus.type === 'loading' ? 'loading' : 'success'}`}>
                    {fetchStatus.text}
                  </div>
                )}
              </div>
            </div>

            {/* Game / Movie Information */}
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {isMovie ? t.movie_info : t.game_info}
                </span>
              </div>
              <div className="neo-card-body">
                <div className="form-field">
                  <label className="form-label">{t.f_title}</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => updateFormField('title', e.target.value)}
                    placeholder={isMovie ? t.f_title_movie_ph : t.f_title_game_ph}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">{t.f_header}</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="mono"
                      value={form.headerImg}
                      onChange={e => updateFormField('headerImg', e.target.value)}
                      placeholder={t.f_header_ph}
                    />
                    <button
                      type="button"
                      className="neo-btn neo-btn-subtle"
                      onClick={() => openUploader('headerImg')}
                    >
                      <IconUpload size={13} />
                      {t.upload_btn}
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">{t.f_quote}</label>
                  <textarea
                    rows={3}
                    value={form.quote}
                    onChange={e => updateFormField('quote', e.target.value)}
                    placeholder={isMovie ? t.f_quote_movie_ph : t.f_quote_game_ph}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">{t.f_imgbox}</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="mono"
                      placeholder="https://img.ptscreens.com/... or https://i.ibb.co.com/..."
                      value={form.imgboxUrl}
                      onChange={e => updateFormField('imgboxUrl', e.target.value)}
                    />
                    <button
                      type="button"
                      className="neo-btn neo-btn-subtle"
                      onClick={() => openUploader('imgboxUrl')}
                    >
                      <IconUpload size={13} />
                      {t.upload_btn}
                    </button>
                  </div>
                </div>

                <div className="field-grid-2 form-field">
                  <div>
                    <label className="form-label">{isMovie ? t.f_year : t.f_release}</label>
                    <input
                      type="text"
                      value={form.releaseDate}
                      onChange={e => updateFormField('releaseDate', e.target.value)}
                      placeholder={isMovie ? 'e.g. 2026' : ''}
                    />
                  </div>
                  <div>
                    <label className="form-label">{t.f_lang}</label>
                    <input
                      type="text"
                      value={form.languages}
                      onChange={e => updateFormField('languages', e.target.value)}
                      placeholder={isMovie ? 'e.g. English, MULTi2' : ''}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">{t.f_genre}</label>
                  <input
                    type="text"
                    value={form.genre}
                    onChange={e => updateFormField('genre', e.target.value)}
                  />
                </div>

                {isMovie ? (
                  <div className="field-grid-2 form-field">
                    <div>
                      <label className="form-label">{t.f_buildname}</label>
                      <input
                        type="text"
                        value={form.buildName}
                        onChange={e => updateFormField('buildName', e.target.value)}
                        placeholder="e.g. Kitsune/AMZN"
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_movie_source}</label>
                      <input
                        type="text"
                        value={form.sourceCrack}
                        onChange={e => updateFormField('sourceCrack', e.target.value)}
                        placeholder="e.g. AMZN, WEB-DL, BluRay"
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_duration}</label>
                      <input
                        type="text"
                        value={form.duration}
                        onChange={e => updateFormField('duration', e.target.value)}
                        placeholder="e.g. 1 h 38 m"
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_imdb}</label>
                      <input
                        type="text"
                        className="mono"
                        value={form.imdbUrl}
                        onChange={e => updateFormField('imdbUrl', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="field-grid-2 form-field">
                      <div>
                        <label className="form-label">{t.f_dev}</label>
                        <input
                          type="text"
                          value={form.developer}
                          onChange={e => updateFormField('developer', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">{t.f_pub}</label>
                        <input
                          type="text"
                          value={form.publisher}
                          onChange={e => updateFormField('publisher', e.target.value)}
                        />
                      </div>
                    </div>

                    {source === 'steam' ? (
                      <div className="field-grid-2 form-field">
                        <div>
                          <label className="form-label">{t.f_build}</label>
                          <input
                            type="text"
                            className="mono"
                            value={form.buildId}
                            onChange={e => updateFormField('buildId', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label">{t.f_buildname}</label>
                          <input
                            type="text"
                            value={form.buildName}
                            onChange={e => updateFormField('buildName', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="form-field">
                        <label className="form-label">{t.f_version}</label>
                        <input
                          type="text"
                          className="mono"
                          value={form.version}
                          onChange={e => updateFormField('version', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="form-field">
                      <label className="form-label">{t.f_included}</label>
                      <textarea
                        rows={3}
                        className="mono"
                        placeholder="Included DLCs or extra content (one per line)"
                        value={form.includedContent}
                        onChange={e => updateFormField('includedContent', e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">{t.f_store}</label>
                      <input
                        type="text"
                        className="mono"
                        value={form.storeUrl}
                        onChange={e => updateFormField('storeUrl', e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">{t.f_source}</label>
                      <input
                        type="text"
                        placeholder="e.g. RUNE, TENOKE, SKIDROW, GOG Rip"
                        value={form.sourceCrack}
                        onChange={e => updateFormField('sourceCrack', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Movie Video & File Info OR Game Repack Information */}
            {isMovie ? (
              <div className="neo-card">
                <div className="neo-card-header">
                  <span className="neo-card-title">
                    {t.movie_specs}
                  </span>
                </div>
                <div className="neo-card-body">
                  <div className="field-grid-2 form-field">
                    <div>
                      <label className="form-label">{t.f_file_size}</label>
                      <input
                        type="text"
                        placeholder="e.g. 1.45 GB"
                        value={form.repackSize}
                        onChange={e => updateFormField('repackSize', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_resolution}</label>
                      <input
                        type="text"
                        placeholder="e.g. 1080p"
                        value={form.resolution}
                        onChange={e => updateFormField('resolution', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_color}</label>
                      <input
                        type="text"
                        placeholder="e.g. BT709"
                        value={form.color}
                        onChange={e => updateFormField('color', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_frameRate}</label>
                      <input
                        type="text"
                        placeholder="e.g. 24 fps"
                        value={form.frameRate}
                        onChange={e => updateFormField('frameRate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="neo-card">
                <div className="neo-card-header">
                  <span className="neo-card-title">
                    {t.repack_info}
                  </span>
                </div>
                <div className="neo-card-body">
                  <div className="field-grid-2 form-field">
                    <div>
                      <label className="form-label">{t.f_repack}</label>
                      <input
                        type="text"
                        placeholder="e.g. 5.83 GB"
                        value={form.repackSize}
                        onChange={e => updateFormField('repackSize', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.f_final}</label>
                      <input
                        type="text"
                        placeholder="e.g. 7.65 GB"
                        value={form.finalSize}
                        onChange={e => updateFormField('finalSize', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.f_ram}</label>
                    <input
                      type="text"
                      placeholder="e.g. 4 GB during installation"
                      value={form.ramRequired}
                      onChange={e => updateFormField('ramRequired', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Download Links */}
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.download_links}
                </span>
                <button
                  className="neo-btn neo-btn-subtle"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={() => setLinks([...links, { id: Date.now(), text: '', url: '' }])}
                >
                  <IconPlus size={12} />
                  {t.add_link}
                </button>
              </div>
              <div className="neo-card-body">
                <p className="field-hint" style={{ marginBottom: 12 }}>{t.links_hint}</p>
                {links.map((link, idx) => (
                  <div key={link.id} className="link-item">
                    <input
                      type="text"
                      placeholder={t.mirror_placeholder}
                      value={link.text}
                      onChange={e => {
                        const updated = [...links];
                        updated[idx].text = e.target.value;
                        setLinks(updated);
                      }}
                    />
                    <input
                      type="text"
                      placeholder={t.url_placeholder}
                      className="mono"
                      value={link.url}
                      onChange={e => {
                        const updated = [...links];
                        updated[idx].url = e.target.value;
                        setLinks(updated);
                      }}
                    />
                    <button
                      type="button"
                      className="neo-btn neo-btn-danger"
                      style={{ padding: '8px 10px' }}
                      onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                      aria-label="Remove link"
                    >
                      <IconClose size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Note */}
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.custom_note}
                </span>
              </div>
              <div className="neo-card-body">
                <div className="form-field">
                  <label className="form-label">{t.note_text_label}</label>
                  <textarea
                    rows={3}
                    className="mono"
                    placeholder={t.note_placeholder}
                    value={form.noteText}
                    onChange={e => updateFormField('noteText', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.note_link_url}</label>
                  <input
                    type="text"
                    className="mono"
                    placeholder={t.note_link_placeholder}
                    value={form.noteLinkUrl}
                    onChange={e => updateFormField('noteLinkUrl', e.target.value)}
                  />
                </div>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={form.noteEnabled}
                    onChange={e => updateFormField('noteEnabled', e.target.checked)}
                  />
                  <span>{t.include_note}</span>
                </label>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="actions-bar">
              <button type="button" className="neo-btn neo-btn-primary" onClick={handleSaveBBCode}>
                <IconSave size={14} />
                {t.save_btn}
              </button>
              <button type="button" className="neo-btn neo-btn-subtle" onClick={handleCopy}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                {copied ? t.copied : t.copy_btn}
              </button>
              <Link
                href="/preview"
                className="neo-btn neo-btn-subtle"
                onClick={() => {
                  if (outputBBCode) localStorage.setItem('bbcode_active_output', outputBBCode);
                }}
              >
                <IconPreview size={14} />
                {t.preview_tool}
              </Link>
              <button type="button" className="neo-btn neo-btn-subtle" onClick={handleClear}>
                {t.clear_btn}
              </button>
              <button type="button" className="neo-btn neo-btn-subtle" onClick={handleLoadExample}>
                {t.example_btn}
              </button>
            </div>
            {saveStatus && (
              <div className="status-banner show success">
                {saveStatus}
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN: Output Area ===== */}
          <div className="output-column">
            <div className="neo-card output-sticky">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.output}
                </span>
                <button type="button" className="neo-btn neo-btn-primary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={handleCopy}>
                  {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                  {copied ? t.copied : t.copy_btn}
                </button>
              </div>
              <div className="neo-card-body">
                <pre className="output-code">{outputBBCode}</pre>
                <p className="field-hint">{t.output_hint}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== Image Uploader Modal ===== */}
      {showUploadModal && (
        <div
          className="neo-modal-backdrop"
          onClick={() => setShowUploadModal(false)}
          onPaste={handlePaste}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.upload_title}
            className="neo-modal-box"
            onClick={e => e.stopPropagation()}
          >
            <div className="neo-modal-head">
              <span className="neo-modal-title">
                {t.upload_title}: {uploadTargetField === 'headerImg' ? t.f_header : t.f_imgbox}
              </span>
              <button
                type="button"
                className="neo-btn neo-btn-subtle"
                style={{ padding: '4px 8px', minHeight: 34 }}
                onClick={() => setShowUploadModal(false)}
                aria-label="Close upload dialog"
              >
                <IconClose size={14} />
              </button>
            </div>

            <div className="neo-modal-body">
              <div className="source-switch" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
                <button
                  type="button"
                  className={`source-btn ${uploadHost === 'ptscreens' ? 'active' : ''}`}
                  onClick={() => setUploadHost('ptscreens')}
                >
                  PTScreens (Chevereto v4)
                </button>
                <button
                  type="button"
                  className={`source-btn ${uploadHost === 'imgbb' ? 'active' : ''}`}
                  onClick={() => setUploadHost('imgbb')}
                >
                  ImgBB
                </button>
              </div>

              {((uploadHost === 'ptscreens' && !apiKeys.ptscreens) || (uploadHost === 'imgbb' && !apiKeys.imgbb)) && (
                <div className="status-banner show error" style={{ marginBottom: 14 }}>
                  {t.upload_missing_key} {uploadHost === 'ptscreens' ? 'PTScreens' : 'ImgBB'}.{' '}
                  <Link href="/account?tab=apikeys" style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}>
                    {t.upload_configure}
                  </Link>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadPreview(URL.createObjectURL(file));
                    handleImageUpload(file);
                  }
                }}
              />
              <button
                type="button"
                className={`neo-dropzone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file) {
                    setUploadPreview(URL.createObjectURL(file));
                    handleImageUpload(file);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="neo-dropzone-icon">
                  <IconUpload size={26} />
                </div>
                <div className="neo-dropzone-title">{t.upload_drop_title}</div>
                <div className="neo-dropzone-sub">{t.upload_drop_sub}</div>
              </button>

              {uploadPreview && (
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    width={240}
                    height={120}
                    style={{ maxHeight: 120, width: 'auto', maxWidth: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>
              )}

              {uploadStatus.text && (
                <div className={`status-banner show ${uploadStatus.type === 'error' ? 'error' : 'success'}`}>
                  {uploadStatus.text}
                </div>
              )}

              {uploadedResultUrl && (
                <div style={{ marginTop: 14 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>{t.upload_inserted}</label>
                  <input type="text" readOnly className="mono" value={uploadedResultUrl} style={{ marginTop: 4 }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
