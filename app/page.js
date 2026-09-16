'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from './components/Header';
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
  IconItch
} from './components/Icons';
import {
  fetchSteamData,
  fetchGogData,
  fetchEpicData,
  fetchItchData
} from './utils/fetchMetadata';

/* ===== Localization Strings (EN / FR / JP) ===== */
const i18n = {
  en: {
    source_steam: 'Steam', source_gog: 'GOG', source_epic: 'Epic', source_itch: 'itch.io',
    steam_fetch: 'Fetch', steam_hint: 'Enter a Steam App ID and click Fetch to auto-fill game info.',
    gog_fetch: 'Fetch', gog_hint: 'Paste a GOG game URL or product ID and click Fetch.',
    epic_fetch: 'Fetch', epic_hint: 'Paste an Epic Games Store product URL or slug and click Fetch.',
    itch_fetch: 'Fetch', itch_hint: 'Paste an itch.io game page URL and click Fetch.',
    game_info: 'Game Information', repack_info: 'Repack Information',
    download_links: 'Download Links', links_hint: 'Add download mirror links manually.',
    add_link: 'Add Link', custom_note: 'Custom Note',
    note_text_label: 'Note content (BBCode supported)', note_link_url: 'Note link URL (inside [note])',
    include_note: 'Include note in output',
    generate_btn: 'Generate BBCode', clear_btn: 'Clear', example_btn: 'Load Example', save_btn: 'Save BBCode',
    output: 'BBCode Output', copy_btn: 'Copy BBCode', preview_btn: 'Preview',
    output_hint: 'Output updates live. Click Copy to paste in your forum post.',
    f_title: 'Title', f_header: 'Header Image URL', f_quote: 'Description',
    f_imgbox: 'NFO / Screenshot Image URL', f_release: 'Release Date', f_lang: 'Languages',
    f_genre: 'Genre', f_dev: 'Developer', f_pub: 'Publisher',
    f_build: 'Build ID', f_buildname: 'Based On', f_included: 'Included Content', f_store: 'Store URL',
    f_source: 'Source / Crack', f_repack: 'Repack Size', f_final: 'Final Size', f_ram: 'RAM Required',
    f_version: 'Version',
    copied: 'Copied!', upload_btn: 'Upload', upload_title: 'Upload Image',
    save_success: 'BBCode saved to Account.', load_success: 'BBCode loaded into form.',
  },
  fr: {
    source_steam: 'Steam', source_gog: 'GOG', source_epic: 'Epic', source_itch: 'itch.io',
    steam_fetch: 'Récupérer', steam_hint: "Entrez un App ID Steam et cliquez sur Récupérer.",
    gog_fetch: 'Récupérer', gog_hint: "Collez l'URL ou l'ID d'un jeu GOG et cliquez sur Récupérer.",
    epic_fetch: 'Récupérer', epic_hint: "Collez l'URL ou le slug Epic Games et cliquez sur Récupérer.",
    itch_fetch: 'Récupérer', itch_hint: "Collez l'URL d'une page itch.io et cliquez sur Récupérer.",
    game_info: 'Informations du Jeu', repack_info: 'Informations Repack',
    download_links: 'Liens de Téléchargement', links_hint: 'Ajoutez les liens miroirs manuellement.',
    add_link: 'Ajouter un lien', custom_note: 'Note Personnalisée',
    note_text_label: 'Contenu de la note (BBCode supporté)', note_link_url: 'URL du lien dans la note',
    include_note: 'Inclure la note dans le résultat',
    generate_btn: 'Générer BBCode', clear_btn: 'Effacer', example_btn: 'Charger Exemple', save_btn: 'Sauvegarder',
    output: 'Résultat BBCode', copy_btn: 'Copier BBCode', preview_btn: 'Aperçu',
    output_hint: 'Le résultat se met à jour en direct. Cliquez sur Copier pour le forum.',
    f_title: 'Titre', f_header: "URL Image d'en-tête", f_quote: 'Description',
    f_imgbox: 'URL Image NFO / Capture', f_release: 'Date de sortie', f_lang: 'Langues',
    f_genre: 'Genre', f_dev: 'Développeur', f_pub: 'Éditeur',
    f_build: 'Build ID', f_buildname: 'Basé sur', f_included: 'Contenu inclus', f_store: 'URL boutique',
    f_source: 'Source / Crack', f_repack: 'Taille repack', f_final: 'Taille finale', f_ram: 'RAM requise',
    f_version: 'Version',
    copied: 'Copié !', upload_btn: 'Téléverser', upload_title: 'Téléverser une image',
    save_success: 'BBCode sauvegardé dans le Compte.', load_success: 'BBCode chargé.',
  },
  jp: {
    source_steam: 'Steam', source_gog: 'GOG', source_epic: 'Epic', source_itch: 'itch.io',
    steam_fetch: '取得', steam_hint: 'Steam App IDを入力して「取得」をクリック。',
    gog_fetch: '取得', gog_hint: 'GOGゲームURLまたはIDを貼り付けて「取得」をクリック。',
    epic_fetch: '取得', epic_hint: 'Epic Games StoreのURLまたはスラッグを入力して「取得」をクリック。',
    itch_fetch: '取得', itch_hint: 'itch.ioのゲームページURLを貼り付けて「取得」をクリック。',
    game_info: 'ゲーム情報', repack_info: 'リパック情報',
    download_links: 'ダウンロードリンク', links_hint: 'リンクを手動で追加。',
    add_link: 'リンク追加', custom_note: 'カスタムノート',
    note_text_label: 'ノート内容（BBCode対応）', note_link_url: 'ノート内リンクURL',
    include_note: 'ノートを出力に含める',
    generate_btn: 'BBCode生成', clear_btn: 'クリア', example_btn: '例を読み込む', save_btn: '保存',
    output: 'BBCode出力', copy_btn: 'BBCodeをコピー', preview_btn: 'プレビュー',
    output_hint: '出力はリアルタイム更新。コピーしてフォーラムに貼り付けます。',
    f_title: 'タイトル', f_header: 'ヘッダー画像URL', f_quote: '説明',
    f_imgbox: 'NFO / スクショ画像URL', f_release: 'リリース日', f_lang: '言語',
    f_genre: 'ジャンル', f_dev: '開発者', f_pub: 'パブリッシャー',
    f_build: 'Build ID', f_buildname: 'ベース', f_included: '含まれるコンテンツ', f_store: 'ストアURL',
    f_source: 'ソース / クラック', f_repack: 'リパックサイズ', f_final: '最終サイズ', f_ram: '必要RAM',
    f_version: 'バージョン',
    copied: 'コピーしました！', upload_btn: 'アップロード', upload_title: '画像アップロード',
    save_success: 'アカウントに保存しました。', load_success: 'BBCodeを読み込みました。',
  }
};

const langMap = {
  English: 'English', French: 'French', Italian: 'Italian', German: 'German',
  Spanish: 'Spanish - Spain', 'Spanish - Latin America': 'Spanish - Latin America',
  Japanese: 'Japanese', Korean: 'Korean', Polish: 'Polish', Portuguese: 'Portuguese - Portugal',
  'Portuguese - Brazil': 'Portuguese - Brazil', Russian: 'Russian', 'Simplified Chinese': 'Simplified Chinese',
  'Traditional Chinese': 'Traditional Chinese', Turkish: 'Turkish', Dutch: 'Dutch',
  Czech: 'Czech', Danish: 'Danish', Finnish: 'Finnish', Greek: 'Greek',
  Hungarian: 'Hungarian', Norwegian: 'Norwegian', Swedish: 'Swedish', Ukrainian: 'Ukrainian'
};

/* ===== Original Default / Sample Data (Mega Man Star Force Legacy Collection) ===== */
const sampleData = {
  appid: '3500390',
  gogUrl: '',
  epicUrl: '',
  itchUrl: '',
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
  version: '',
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

const blankForm = {
  appid: '', gogUrl: '', epicUrl: '', itchUrl: '',
  title: '', headerImg: '', quote: '', imgboxUrl: '',
  releaseDate: '', languages: '', genre: '', developer: '', publisher: '',
  buildId: '', buildName: '', version: '', includedContent: '', storeUrl: '',
  sourceCrack: '', repackSize: '', finalSize: '', ramRequired: '',
  noteText: '', noteLinkUrl: '', noteEnabled: false
};

export default function Home() {
  const [lang, setLang] = useState('en');
  const [source, setSource] = useState('steam');
  const [form, setForm] = useState(sampleData);
  const [links, setLinks] = useState(sampleData.links);
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

  const t = i18n[lang] || i18n.en;

  // Mount initialization: Language listener, pending load, Supabase & user keys
  useEffect(() => {
    // 1. Language sync
    const savedLang = localStorage.getItem('bbcode_lang') || 'en';
    setLang(savedLang);

    const onLangChange = (e) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('bbcode-lang-change', onLangChange);

    // 2. Check if user navigated here with a "Load BBCode" payload
    const pendingLoad = localStorage.getItem('bbcode_load_pending');
    if (pendingLoad) {
      try {
        const parsed = JSON.parse(pendingLoad);
        setForm(parsed);
        if (parsed.links) setLinks(parsed.links);
        if (parsed.source) setSource(parsed.source);
        localStorage.removeItem('bbcode_load_pending');
        setSaveStatus(t.load_success);
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (e) {}
    }

    // 3. Load API keys for current session
    const loadKeys = () => {
      const active = localStorage.getItem('bbcode_api_keys_active');
      const guest = localStorage.getItem('bbcode_api_keys_guest');
      const raw = active || guest;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setApiKeys(parsed);
          if (parsed.defaultUploader) setUploadHost(parsed.defaultUploader);
        } catch (e) {}
      }
    };
    loadKeys();

    // 4. Supabase Auth Check
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (sbUrl && sbKey) {
      try {
        const client = createClient(sbUrl, sbKey);
        setSupabaseClient(client);

        client.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            handleUserAuth(client, session.user);
          }
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            handleUserAuth(client, session.user);
          } else {
            setUser(null);
          }
        });

        return () => {
          subscription.unsubscribe();
          window.removeEventListener('bbcode-lang-change', onLangChange);
        };
      } catch (e) {}
    }

    return () => window.removeEventListener('bbcode-lang-change', onLangChange);
  }, [t.load_success]);

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

    // 1. Fetch user-specific API keys from Supabase
    let cloudKeys = null;
    try {
      const { data, error } = await client
        .from('user_api_keys')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle();

      if (!error && data && (data.ptscreens_api_key || data.imgbb_api_key)) {
        cloudKeys = {
          ptscreens: data.ptscreens_api_key || data.ptscreens_key || '',
          imgbb: data.imgbb_api_key || data.imgbb_key || '',
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

    // 2. If Supabase has no keys yet, check browser cache & auto-sync to Supabase
    const cached = localStorage.getItem(`bbcode_api_keys_${u.id}`) ||
                   localStorage.getItem('bbcode_api_keys_active') ||
                   localStorage.getItem('bbcode_api_keys_guest');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.ptscreens || parsed.imgbb)) {
          const keysToSync = {
            ptscreens: parsed.ptscreens?.trim() || '',
            imgbb: parsed.imgbb?.trim() || '',
            defaultUploader: parsed.defaultUploader || 'ptscreens'
          };
          setApiKeys(keysToSync);
          if (keysToSync.defaultUploader) setUploadHost(keysToSync.defaultUploader);
          localStorage.setItem(`bbcode_api_keys_${u.id}`, JSON.stringify(keysToSync));
          localStorage.setItem('bbcode_api_keys_active', JSON.stringify(keysToSync));

          // Auto-upsert to Supabase
          await client.from('user_api_keys').upsert({
            user_id: u.id,
            ptscreens_api_key: keysToSync.ptscreens,
            imgbb_api_key: keysToSync.imgbb,
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

  // Generate clean BBCode Output — matches example bbcodes.txt exactly
  const generateBBCode = useCallback(() => {
    const title = form.title || 'Game Title';
    const headerImg = form.headerImg || '';
    const quote = form.quote || '';
    const imgboxUrl = form.imgboxUrl || '';
    const releaseDate = form.releaseDate || '';
    const genre = form.genre || '';
    const developer = form.developer || '';
    const publisher = form.publisher || '';
    const buildId = form.buildId || '';
    const buildName = form.buildName || title;
    const languages = form.languages || 'Single';
    const sourceCrack = form.sourceCrack || '';
    const version = form.version || '';
    const repackSize = form.repackSize || 'N/A';
    const finalSize = form.finalSize || 'N/A';
    const ramRequired = form.ramRequired || 'N/A';
    const storeUrl = form.storeUrl || '';

    const isSteam = source === 'steam';
    let basedOnLine = '';
    if (isSteam) {
      basedOnLine = '[b]Based On: [/b]' + buildName + (buildId ? ' (Build ' + buildId + ' )' : ' ( - )');
    } else {
      if (version) {
        basedOnLine = '[b]Based On: [/b]' + buildName + ' (Version ' + version + ' )';
      } else {
        basedOnLine = '[b]Based On: [/b]' + buildName + ' ( - )';
      }
    }

    let b = '';
    b += '[center][size=175][b][color=#8040FF]' + title + '[/color][/b][/size]\r\n\r\n';
    if (headerImg) b += '[img]' + headerImg + '[/img]\r\n';
    if (quote) b += '[size=105][quote]' + quote + '[/quote][/size]\r\n';
    if (imgboxUrl) b += '\r\n[img]' + imgboxUrl + '[/img]\r\n\r\n\r\n';
    else b += '\r\n\r\n';

    b += '[size=145][b][color=#8040FF][u]\u2727 Game Info \u2727[/u][/color][/b][/size]\r\n\r\n';
    b += '[size=105]';
    b += basedOnLine + '\r\n';
    b += '[b]Release Date: [/b]' + releaseDate + '\r\n';
    b += '[b]Genre: [/b]' + genre + '\r\n';
    b += '[b]Developer:[/b] ' + developer + '\r\n';
    b += '[b]Publisher:[/b] ' + publisher + '\r\n';
    b += '[b]Languages: [/b]' + languages + '\r\n';
    b += '[b]Source/Crack: [/b]' + sourceCrack + '\r\n';

    b += '\r\n[size=145][b][color=#8040FF][u]\u2727 Repack Info \u2727[/u][/color][/b][/size]\r\n\r\n';
    b += '[b]Repack Size: [/b]' + repackSize + '\r\n';
    b += '[b]Final Size: [/b]' + finalSize + '\r\n';
    b += '[b]RAM Required: [/b]' + ramRequired + '\r\n';

    if (storeUrl) {
      b += '\r\n\r\n[b]Store: [/b][url=' + storeUrl + ']' + storeUrl + '[/url]\r\n';
    }

    const includedContent = form.includedContent ? form.includedContent.trim() : '';
    if (includedContent) {
      const lines = includedContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const formattedLines = lines.join('\r\n');
      if (formattedLines) {
        b += '\r\n\r\n[size=145][b][color=#8040FF][u]\u2727 Included Content \u2727[/u][/color][/b][/size]\r\n\r\n';
        b += '[size=105][size=95]' + formattedLines + '[/size][/size]\r\n\r\n\r\n';
      }
    }

    b += '\r\n[color=#BF0000][b]100% Lossless & MD5 Perfect: all files are identical to originals after installation[/b][/color]\r\n\r\n[/size]\r\n\r\n\r\n';

    b += '[size=145][b][color=#8040FF]Download Links[/color][/b][/size]\r\n\r\n';
    const activeLinks = links.filter(l => l.text.trim() || l.url.trim());
    activeLinks.forEach(link => {
      const text = link.text.trim();
      const url = link.url.trim();
      if (url) {
        b += '[size=105][url=' + url + '][color=#FFFFFF]' + (text || url) + '[/color][/url][/size]\r\n';
      } else {
        b += '[size=105][url][color=#FFFFFF]' + (text || 'Link') + '[/color][/url][/size]\r\n';
      }
    });

    b += '\r\n\r\n';

    if (form.noteEnabled) {
      const noteText = form.noteText ? form.noteText.trim() : '';
      const noteLinkUrl = form.noteLinkUrl ? form.noteLinkUrl.trim() : '';
      if (noteText) {
        const cleanNote = noteText.replace(/\r?\n/g, '\r\n');
        b += '[size=110][note]';
        if (noteLinkUrl) b += cleanNote + ' [url=' + noteLinkUrl + '](note)[/url][/note][/size]\r\n\r\n\r\n';
        else b += cleanNote + '[/note][/size]\r\n\r\n\r\n';
      }
    }

    b += '[b][color=#8040FF]IF YOU LIKE THIS GAME PLEASE SUPPORT THE DEVELOPERS & BUY IT![/color][/b]\r\n';
    b += '[/center]';
    return b;
  }, [form, links, source]);

  const outputBBCode = generateBBCode();

  useEffect(() => {
    if (outputBBCode) {
      localStorage.setItem('bbcode_active_output', outputBBCode);
    }
  }, [outputBBCode]);

  // --- Store Fetch Handlers (Directly using user's proxy chain & parsers from script.js) ---
  // If specific fields are not returned by the API, clear them instead of keeping old data
  async function handleSteamFetch() {
    const appid = form.appid.trim();
    if (!appid) {
      setFetchStatus({ text: 'Please enter a numeric Steam App ID.', type: 'error' });
      return;
    }
    setFetching(true);
    setFetchStatus({ text: 'Fetching from Steam API...', type: 'loading' });

    try {
      const data = await fetchSteamData(appid, (msg, type) => {
        setFetchStatus({ text: msg, type });
      });
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
      const data = await fetchGogData(input, (msg, type) => {
        setFetchStatus({ text: msg, type });
      });
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
      const data = await fetchEpicData(input, (msg, type) => {
        setFetchStatus({ text: msg, type });
      });
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
      const data = await fetchItchData(input, (msg, type) => {
        setFetchStatus({ text: msg, type });
      });
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

  // --- Copy BBCode ---
  async function handleCopy() {
    if (!outputBBCode) return;
    await navigator.clipboard.writeText(outputBBCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- Save BBCode to Cloud / Local ---
  async function handleSaveBBCode() {
    if (!form.title) {
      alert('Please provide a Title before saving.');
      return;
    }

    const payload = {
      id: Date.now().toString(),
      title: form.title,
      bbcode: outputBBCode,
      form_data: { ...form, links, source },
      updated_at: new Date().toISOString()
    };

    if (supabaseClient && user) {
      try {
        const { error } = await supabaseClient.from('saved_bbcodes').upsert({
          user_id: user.id,
          title: form.title,
          bbcode: outputBBCode,
          form_data: { ...form, links, source },
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
    setSource('steam');
    setForm(sampleData);
    setLinks(sampleData.links);
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
      <main className="main-layout">
        <div className="content-grid">
          {/* ===== LEFT COLUMN: Form Controls ===== */}
          <div className="form-column">
            {/* Store Source Selector with Official Store SVGs */}
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  Metadata Source
                </span>
              </div>
              <div className="neo-card-body">
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
                        type="number"
                        placeholder="Steam App ID (e.g. 3500390)"
                        className="mono"
                        value={form.appid}
                        onChange={e => updateFormField('appid', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSteamFetch()}
                      />
                      <button className="neo-btn neo-btn-primary" onClick={handleSteamFetch} disabled={fetching}>
                        {fetching ? 'Fetching...' : t.steam_fetch}
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
                        {fetching ? 'Fetching...' : t.gog_fetch}
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
                        {fetching ? 'Fetching...' : t.epic_fetch}
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
                        {fetching ? 'Fetching...' : t.itch_fetch}
                      </button>
                    </div>
                    <p className="field-hint">{t.itch_hint}</p>
                  </div>
                )}

                {fetchStatus.text && (
                  <div className={`status-banner show ${fetchStatus.type === 'error' ? 'error' : fetchStatus.type === 'loading' ? 'loading' : 'success'}`}>
                    {fetchStatus.text}
                  </div>
                )}
              </div>
            </div>

            {/* Game Information (Clean labels, zero auto/manual badges) */}
            <div className="neo-card">
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.game_info}
                </span>
              </div>
              <div className="neo-card-body">
                <div className="form-field">
                  <label className="form-label">{t.f_title}</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => updateFormField('title', e.target.value)}
                    placeholder="Game Title"
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
                      placeholder="Header image URL"
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
                    placeholder="Game synopsis or overview"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">{t.f_imgbox}</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="mono"
                      placeholder="https://img.ptscreen.com/... or https://i.ibb.co.com/..."
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
                    <label className="form-label">{t.f_release}</label>
                    <input
                      type="text"
                      value={form.releaseDate}
                      onChange={e => updateFormField('releaseDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">{t.f_lang}</label>
                    <input
                      type="text"
                      value={form.languages}
                      onChange={e => updateFormField('languages', e.target.value)}
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
              </div>
            </div>

            {/* Repack Information */}
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
                      placeholder="Mirror / Host Name"
                      value={link.text}
                      onChange={e => {
                        const updated = [...links];
                        updated[idx].text = e.target.value;
                        setLinks(updated);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Download URL"
                      className="mono"
                      value={link.url}
                      onChange={e => {
                        const updated = [...links];
                        updated[idx].url = e.target.value;
                        setLinks(updated);
                      }}
                    />
                    <button
                      className="neo-btn neo-btn-danger"
                      style={{ padding: '8px 10px' }}
                      onClick={() => setLinks(links.filter((_, i) => i !== idx))}
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
                    placeholder="Custom repack warnings, crack install instructions..."
                    value={form.noteText}
                    onChange={e => updateFormField('noteText', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.note_link_url}</label>
                  <input
                    type="text"
                    className="mono"
                    placeholder="Optional link URL inside [note]"
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
              <button className="neo-btn neo-btn-primary" onClick={handleSaveBBCode}>
                <IconSave size={14} />
                {t.save_btn}
              </button>
              <button className="neo-btn neo-btn-primary" onClick={handleCopy}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                {copied ? t.copied : t.copy_btn}
              </button>
              <Link href="/preview" className="neo-btn neo-btn-subtle">
                <IconPreview size={14} />
                Preview Tool
              </Link>
              <button className="neo-btn neo-btn-subtle" onClick={handleClear}>
                {t.clear_btn}
              </button>
              <button className="neo-btn neo-btn-subtle" onClick={handleLoadExample}>
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
            <div className="neo-card" style={{ position: 'sticky', top: 76 }}>
              <div className="neo-card-header">
                <span className="neo-card-title">
                  {t.output}
                </span>
                <button className="neo-btn neo-btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={handleCopy}>
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
          <div className="neo-modal-box" onClick={e => e.stopPropagation()}>
            <div className="neo-modal-head">
              <span className="neo-modal-title">
                {t.upload_title} &rarr; {uploadTargetField === 'headerImg' ? t.f_header : t.f_imgbox}
              </span>
              <button className="neo-btn neo-btn-subtle" style={{ padding: '3px 7px' }} onClick={() => setShowUploadModal(false)}>
                <IconClose size={14} />
              </button>
            </div>

            <div className="neo-modal-body">
              {/* Host Selector */}
              <div className="source-switch" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
                <button
                  className={`source-btn ${uploadHost === 'ptscreens' ? 'active' : ''}`}
                  onClick={() => setUploadHost('ptscreens')}
                >
                  PTScreens (Chevereto v4)
                </button>
                <button
                  className={`source-btn ${uploadHost === 'imgbb' ? 'active' : ''}`}
                  onClick={() => setUploadHost('imgbb')}
                >
                  ImgBB
                </button>
              </div>

              {/* Host key warning if missing */}
              {((uploadHost === 'ptscreens' && !apiKeys.ptscreens) || (uploadHost === 'imgbb' && !apiKeys.imgbb)) && (
                <div className="status-banner show error" style={{ marginBottom: 14 }}>
                  No API key configured for {uploadHost === 'ptscreens' ? 'PTScreens' : 'ImgBB'}.{' '}
                  <Link href="/account" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    Configure in Account &rarr;
                  </Link>
                </div>
              )}

              {/* Dropzone */}
              <div
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
                <div className="neo-dropzone-icon">
                  <IconUpload size={28} />
                </div>
                <div className="neo-dropzone-title">Click to browse or drag image here</div>
                <div className="neo-dropzone-sub">Supports PNG, JPG, WebP. You can also paste directly with Ctrl + V</div>
              </div>

              {uploadPreview && (
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 4, border: '2px solid var(--border)' }}
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
                  <label className="form-label" style={{ fontSize: 11 }}>Direct Image URL Inserted:</label>
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
