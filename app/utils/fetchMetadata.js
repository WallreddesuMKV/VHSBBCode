/* =========================================================
   BBCode Gen — Exact CORS Proxies & Parsers from script.js
   Matches script.js lines 153-870 verbatim without breaking changes
   ========================================================= */

const langMap = {
  'english': 'English', 'french': 'French', 'german': 'German', 'spanish': 'Spanish',
  'italian': 'Italian', 'russian': 'Russian', 'japanese': 'Japanese', 'korean': 'Korean',
  'portuguese': 'Portuguese', 'polish': 'Polish', 'dutch': 'Dutch', 'czech': 'Czech',
  'danish': 'Danish', 'finnish': 'Finnish', 'hungarian': 'Hungarian', 'norwegian': 'Norwegian',
  'romanian': 'Romanian', 'slovak': 'Slovak', 'swedish': 'Swedish', 'thai': 'Thai',
  'turkish': 'Turkish', 'brazilian': 'Brazilian Portuguese', 'schinese': 'Simplified Chinese',
  'tchinese': 'Traditional Chinese', 'arabic': 'Arabic', 'bulgarian': 'Bulgarian',
  'greek': 'Greek', 'ukrainian': 'Ukrainian', 'latam': 'Latin American Spanish',
  'vietnamese': 'Vietnamese', 'indonesian': 'Indonesian'
};

/* ===== CORS Proxies — exact fallback chain from script.js lines 174-204 ===== */
export async function fetchViaProxy(targetUrl) {
  const appidMatch = targetUrl.match(/(?:appids?=|\/app\/)(\d+)/);
  const appid = appidMatch ? appidMatch[1] : null;
  const isSteamStore = targetUrl.includes('steampowered.com');
  const proxies = [
    // User's multi-purpose worker proxy
    'https://darkdeadfire95861xyz.wallreddesu.workers.dev/proxy?url=' + encodeURIComponent(targetUrl),
    ...(appid && isSteamStore ? [
      'https://d1ceb68d.proxy-8qv.pages.dev/' + appid,
      'https://d1ceb68d.proxy-8qv.pages.dev/?appid=' + appid,
    ] : []),
    'https://cors-get-proxy.sirjosh.workers.dev/?url=' + encodeURIComponent(targetUrl),
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl),
  ];
  for (let i = 0; i < proxies.length; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const r = await fetch(proxies[i], { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      if (r.ok) {
        const text = await r.text();
        if (!text || text.length < 50) continue;
        if (text.includes('cf-browser-verification') || text.includes('Just a moment')) continue;
        return text;
      }
    } catch (e) {}
  }
  throw new Error('All CORS proxies failed');
}

/* ===== Steam language logic from script.js lines 221-236 ===== */
export function computeLanguageString(d) {
  const sLangs = d.supported_languages || {};
  if (typeof sLangs === 'string') {
    const cleaned = sLangs.replace(/<[^>]+>/g, '').replace(/\*/g, '');
    const langs = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    if (langs.length <= 1) return langs[0] || 'English';
    return 'MULTi' + langs.length;
  }
  let lCount = 0;
  const lList = [];
  for (let l in sLangs) {
    const v = sLangs[l];
    if (v === true || (typeof v === 'object' && v && v.supported !== false)) {
      lCount++;
      lList.push(l);
    }
  }
  const rLangs = lList.map(l => langMap[l.toLowerCase()] || l);
  if (lCount <= 1) return rLangs.length > 0 ? rLangs.join(', ') : 'English';
  return 'MULTi' + lCount;
}

/* ===== Steam API response parser ===== */
export function parseSteamResponse(data, appid) {
  if (!data || typeof data !== 'object') return null;
  const root = (data.data && typeof data.data === 'object' && !data.data.name) ? data.data : data;
  return root[appid] ||
    Object.values(root).find(v => v?.data?.steam_appid == appid) ||
    Object.values(root).find(v => v && typeof v === 'object' && v.success) ||
    Object.values(root)[0] ||
    null;
}

/* ===== 1. Fetch Steam Data from script.js lines 239-398 ===== */
export async function fetchSteamData(appidInput, onProgress) {
  const appidMatch = String(appidInput || '').trim().match(/(?:appids?\/|appids?=|\/app\/|^)(\d+)/i) || String(appidInput || '').match(/(\d+)/);
  const appid = appidMatch ? appidMatch[1] : String(appidInput || '').trim();
  if (!appid) throw new Error('Please enter a numeric Steam App ID.');

  onProgress?.('Fetching from Steam API...', 'loading');

  const steamApiUrl = 'https://store.steampowered.com/api/appdetails?appids=' + appid + '&l=english';
  let jsonText = '';
  try {
    jsonText = await fetchViaProxy(steamApiUrl);
  } catch (e) {
    throw new Error('CORS proxy failed. Try again.');
  }

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error('Invalid response from Steam API.');
  }

  const game = parseSteamResponse(data, appid);
  if (!game || !game.success) {
    throw new Error('Game not found on Steam Store API.');
  }

  const d = game.data;
  const title = d.name || '';

  // Header image
  let header = d.header_image || '';
  const hM = header.match(/\/steam\/apps\/(\d+)\/(header[^?]*)/);
  if (hM) {
    header = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + hM[1] + '/' + hM[2];
    const tM = (d.header_image || '').match(/\?t=(\d+)/);
    if (tM) header += '?t=' + tM[1];
  }

  const quote = d.short_description || d.about_the_game || '';
  const releaseDate = (d.release_date && d.release_date.date) ? d.release_date.date : '';
  const developer = (d.developers || []).join(', ');
  const publisher = (d.publishers || []).join(', ');

  // Tags from SteamStore / SteamSpy
  let popularTags = [];
  try {
    const spyRes = await fetch('https://steamspy.com/api.php?request=appdetails&appid=' + appid);
    if (spyRes.ok) {
      const spyData = await spyRes.json();
      if (spyData && spyData.tags && typeof spyData.tags === 'object') {
        popularTags = Object.keys(spyData.tags).filter(Boolean);
      }
    }
  } catch (e) {}

  if (!popularTags || popularTags.length === 0) {
    try {
      const storeHtml = await fetchViaProxy('https://store.steampowered.com/app/' + appid + '/');
      const modalMatch = storeHtml.match(/InitAppTagModal\s*\(\s*\d+\s*,\s*(\[[^;]+?\])\s*,\s*/);
      if (modalMatch) {
        const parsedTags = JSON.parse(modalMatch[1]);
        if (Array.isArray(parsedTags)) {
          popularTags = parsedTags.map(t => t.name).filter(Boolean);
        }
      }
      if (!popularTags || popularTags.length === 0) {
        const tagMatches = [...storeHtml.matchAll(/class=["']app_tag["'][^>]*>\s*([^<\r\n]+?)\s*<\/a>/gi)];
        popularTags = tagMatches.map(m => m[1].trim()).filter(t => t && t !== '+');
      }
    } catch (e) {}
  }

  let genre = '';
  if (popularTags && popularTags.length > 0) {
    const uniqueTags = Array.from(new Set(popularTags)).slice(0, 6);
    genre = uniqueTags.join(', ');
  } else if (d.genres && Array.isArray(d.genres)) {
    genre = d.genres.map(g => g.description).join(', ');
  }

  const languages = computeLanguageString(d);
  const slug = d.name ? d.name.replace(/\s+/g, '_').replace(/[^\w-]/g, '') : '';
  const storeUrl = 'https://store.steampowered.com/app/' + appid + '/' + (slug ? slug + '/' : '');

  // Fetch Build ID from SteamCMD / SteamDB
  let buildId = '';
  let steamCmdData = null;
  onProgress?.('Fetching Build ID from SteamDB / SteamCMD...', 'loading');
  try {
    const cmdRes = await fetch('https://api.steamcmd.net/v1/info/' + appid);
    if (cmdRes.ok) {
      steamCmdData = await cmdRes.json();
      const cmdApp = steamCmdData?.data?.[appid] || (steamCmdData?.data && Object.values(steamCmdData.data)[0]);
      const bId = cmdApp?.depots?.branches?.public?.buildid;
      if (bId) buildId = String(bId);
    }
  } catch (e) {}

  // Fallback to SteamDB depots
  if (!buildId) {
    try {
      const html = await fetchViaProxy('https://steamdb.info/app/' + appid + '/depots/');
      const m = html.match(/Latest\s*Build[\s\S]{0,200}?(\d{6,})/i) ||
                html.match(/data-buildid="(\d+)"/) ||
                html.match(/buildid["'\s:=]+(\d{5,})/i) ||
                html.match(/"buildid"\s*:\s*(\d+)/);
      if (m) buildId = m[1];
    } catch (e) {}
  }

  // Fallback to SteamDB info
  if (!buildId) {
    try {
      const html2 = await fetchViaProxy('https://steamdb.info/app/' + appid + '/info/');
      const m2 = html2.match(/Public[\s\S]{0,150}?(\d{7,})/i);
      if (m2) buildId = m2[1];
    } catch (e) {}
  }

  // Auto-fetch Included Content (DLCs) - NO LIMITATION
  let dlcIds = [];
  let includedContent = '';
  const cmdApp = steamCmdData?.data?.[appid] || (steamCmdData?.data && Object.values(steamCmdData.data)[0]);
  if (d.dlc && Array.isArray(d.dlc) && d.dlc.length > 0) {
    dlcIds = d.dlc;
  } else if (cmdApp?.extended?.listofdlc) {
    dlcIds = String(cmdApp.extended.listofdlc).split(',').map(s => s.trim()).filter(Boolean);
  }

  if (dlcIds.length > 0) {
    onProgress?.(`Fetching Included Content (DLC)... (0/${dlcIds.length})`, 'loading');
    try {
      const batchSize = 10;
      const dlcResults = [];
      for (let i = 0; i < dlcIds.length; i += batchSize) {
        const chunk = dlcIds.slice(i, i + batchSize);
        const chunkResults = await Promise.all(chunk.map(async id => {
          try {
            const res = await fetchViaProxy('https://store.steampowered.com/api/appdetails?appids=' + id + '&l=english');
            const parsed = JSON.parse(res);
            const item = parseSteamResponse(parsed, id);
            return item?.data?.name || null;
          } catch (e) {
            return null;
          }
        }));
        dlcResults.push(...chunkResults);
        const doneCount = Math.min(i + batchSize, dlcIds.length);
        onProgress?.(`Fetching Included Content (DLC)... (${doneCount}/${dlcIds.length})`, 'loading');
      }
      const validNames = dlcResults.filter(Boolean);
      if (validNames.length > 0) {
        includedContent = validNames.map(n => n.startsWith('-') ? n : '- ' + n).join('\n');
      }
    } catch (e) {}
  }

  return {
    title,
    headerImg: header,
    quote,
    releaseDate,
    genre,
    developer,
    publisher,
    languages,
    buildId: buildId || '',
    buildName: title,
    storeUrl,
    version: '',
    includedContent
  };
}

/* ===== 2. Fetch GOG Data from script.js lines 401-559 ===== */
export async function fetchGogData(input, onProgress) {
  if (!input) throw new Error('Please enter a GOG URL or product ID.');

  onProgress?.('Fetching from GOG...', 'loading');

  let url = input.trim();
  let productId = /^\d+$/.test(url) ? url : null;
  let slug = '';
  const m = url.match(/\/game\/([^\/?#]+)/i);
  if (m) slug = m[1];
  else if (!productId && !url.startsWith('http')) slug = url;

  if (!url.startsWith('http')) {
    url = productId ? 'https://api.gog.com/products/' + productId : 'https://www.gog.com/en/game/' + slug;
  }

  let html = '';
  let apiData = null;

  if (productId || url.includes('api.gog.com')) {
    try {
      const pId = productId || url.match(/products\/(\d+)/)?.[1];
      const res = await fetchViaProxy('https://api.gog.com/products/' + pId + '?expand=description,screenshots');
      apiData = JSON.parse(res);
    } catch (e) {}
  }

  if (!apiData) {
    try {
      html = await fetchViaProxy(url);
    } catch (e) {
      throw new Error('Could not fetch GOG data. Check the URL or ID & try again.');
    }
    const mCard = html.match(/card-product=[\x22'](\d+)[\x22']/);
    if (mCard) {
      try {
        const res = await fetchViaProxy('https://api.gog.com/products/' + mCard[1] + '?expand=description,screenshots');
        apiData = JSON.parse(res);
      } catch (e) {}
    }
  }

  let title = '';
  let headerImg = '';
  let quote = '';
  let releaseDate = '';
  let genre = '';
  let developer = '';
  let publisher = '';
  let languages = 'English';
  let gogStoreUrl = url.includes('api.gog.com') && apiData?.slug ? 'https://www.gog.com/en/game/' + apiData.slug : url;
  let includedContent = '';

  // Extract GOG product card logo 960x570 from HTML as requested
  if (html) {
    const mLogo960 = html.match(/(?:https?:)?\/\/images(?:-\d+)?\.gog-statics\.com\/[a-f0-9]+_product_card_v2_logo_960x570\.[a-z0-9]+/i);
    const mLogoAny = html.match(/(?:https?:)?\/\/images(?:-\d+)?\.gog-statics\.com\/[a-f0-9]+_product_card_v2_logo[^\s"']+/i);
    if (mLogo960) {
      headerImg = mLogo960[0].startsWith('http') ? mLogo960[0] : 'https:' + mLogo960[0];
    } else if (mLogoAny) {
      headerImg = mLogoAny[0].startsWith('http') ? mLogoAny[0] : 'https:' + mLogoAny[0];
    }
  }

  if (apiData) {
    title = apiData.title || '';
    if (!headerImg) {
      if (apiData.images?.logo2x || apiData.images?.logo) {
        const logo = apiData.images.logo2x || apiData.images.logo;
        headerImg = logo.startsWith('//') ? 'https:' + logo : logo;
      } else if (apiData.images?.background) {
        headerImg = apiData.images.background.startsWith('//') ? 'https:' + apiData.images.background : apiData.images.background;
      }
    }
    if (apiData.description?.lead) quote = apiData.description.lead.replace(/<[^>]+>/g, '').trim();
    if (apiData.release_date) {
      try {
        const rd = new Date(apiData.release_date);
        releaseDate = rd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        releaseDate = apiData.release_date;
      }
    }
    if (apiData.languages) {
      const lCount = Object.keys(apiData.languages).length;
      languages = lCount > 1 ? 'MULTi' + lCount : (Object.values(apiData.languages)[0] || 'English');
    }
    if (apiData.links?.product_card) gogStoreUrl = apiData.links.product_card;
    if (apiData.dlcs && Array.isArray(apiData.dlcs.products) && apiData.dlcs.products.length > 0) {
      includedContent = apiData.dlcs.products.map(p => '- ' + (p.title || p)).join('\n');
    }
  }

  if (html) {
    if (!title) {
      const mOg = html.match(/<meta property=[\x22']og:title[\x22'] content=[\x22']([^'\x22]+)[\x22']/i);
      if (mOg) title = mOg[1].replace(/\s*-\s*GOG\.com/i, '').replace(/\s*\|\s*GOG\.com/i, '').replace(/^Buy\s+/i, '').trim();
    }
    if (!headerImg) {
      const mImg = html.match(/<meta property=[\x22']og:image[\x22'] content=[\x22']([^'\x22]+)[\x22']/i);
      if (mImg) headerImg = mImg[1];
    }
    if (!quote) {
      const mDesc = html.match(/<meta property=[\x22']og:description[\x22'] content=[\x22']([^'\x22]+)[\x22']/i);
      if (mDesc) quote = mDesc[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    }
    const mJsonLd = html.match(/<script type=[\x22']application\/ld\+json[\x22']>([\s\S]*?)<\/script>/i);
    if (mJsonLd) {
      try {
        const ld = JSON.parse(mJsonLd[1]);
        if (!title && ld.name) title = ld.name;
        if (!releaseDate && ld.releaseDate) releaseDate = ld.releaseDate;
        if (ld.genre) genre = Array.isArray(ld.genre) ? ld.genre.join(', ') : ld.genre;
        if (ld.author?.name) developer = ld.author.name;
        if (ld.publisher?.name) publisher = ld.publisher.name;
      } catch (e) {}
    }
    if (!developer) {
      const devMatch = html.match(/href="\/games\?developers=[^"]*"[^>]*>([^<]+)<\/a>/i);
      if (devMatch) developer = devMatch[1].trim();
    }
    if (!publisher) {
      const pubMatch = html.match(/href="\/games\?publishers=[^"]*"[^>]*>([^<]+)<\/a>/i);
      if (pubMatch) publisher = pubMatch[1].trim();
    }
    if (!genre) {
      const genreMatches = [...html.matchAll(/href="\/games\?genres=[^"]*"[^>]*>([^<]+)<\/a>/gi)];
      if (genreMatches.length > 0) {
        genre = Array.from(new Set(genreMatches.map(m => m[1].trim()).filter(Boolean))).join(', ');
      }
    }
    if (!releaseDate) {
      const rdMatch = html.match(/Release date:.*?(\d{4}-\d{2}-\d{2})/i) || html.match(/"releaseDate":\s*"([^"]+)"/);
      if (rdMatch) {
        try {
          const rd = new Date(rdMatch[1]);
          releaseDate = rd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
          releaseDate = rdMatch[1];
        }
      }
    }
  }

  if (!title) {
    throw new Error('Could not fetch GOG data. Check the URL or ID & try again.');
  }

  return {
    title,
    headerImg,
    quote,
    releaseDate,
    genre,
    developer,
    publisher,
    languages,
    buildName: title,
    storeUrl: gogStoreUrl,
    buildId: '',
    version: '',
    includedContent
  };
}

/* ===== 3. Fetch Epic Games Data from script.js lines 562-692 ===== */
export async function fetchEpicData(input, onProgress) {
  if (!input) throw new Error('Please enter an Epic Games URL or slug.');

  onProgress?.('Fetching from Epic Games Store...', 'loading');

  let url = input.trim();
  let slug = '';
  const m = url.match(/\/p\/([^\/?#]+)/i);
  if (m) slug = m[1];
  else slug = url.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '').replace(/\/+$/, '');

  const epicStoreUrl = url.startsWith('http') ? url : 'https://store.epicgames.com/en-US/p/' + slug;

  let title = '';
  let headerImg = '';
  let quote = '';
  let releaseDate = '';
  let genre = '';
  let developer = '';
  let publisher = '';
  let dlcNames = [];
  let wData = null;
  let page = null;

  // 1. Query user's dedicated worker endpoint for Epic by slug
  try {
    const wRes = await fetch('https://darkdeadfire95861xyz.wallreddesu.workers.dev/epic/' + encodeURIComponent(slug));
    if (wRes.ok) {
      wData = await wRes.json();
      if (wData && wData.success !== false) {
        title = wData.title || '';
        quote = wData.description || '';
        if (wData.raw?.developerDisplayName) developer = wData.raw.developerDisplayName;
        if (wData.raw?.publisherDisplayName) publisher = wData.raw.publisherDisplayName;
        if (!developer && wData.raw?.seller?.name) developer = wData.raw.seller.name;
        if (!publisher && wData.raw?.seller?.name) publisher = wData.raw.seller.name;
        if (wData.raw?.releaseDate) {
          try {
            const rd = new Date(wData.raw.releaseDate);
            releaseDate = rd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          } catch (e) {}
        }
        if (wData.raw?.tags && Array.isArray(wData.raw.tags)) {
          genre = wData.raw.tags.map(t => t.name || t).filter(Boolean).join(', ');
        }
      }
    }
  } catch (e) {}

  // 2. Fetch or supplement via store-content API via proxy
  try {
    const apiUrl = 'https://store-content-ipv4.ak.epicgames.com/api/en-US/content/products/' + slug;
    let d = null;
    try {
      const res = await fetchViaProxy(apiUrl);
      d = JSON.parse(res);
    } catch (e) {}

    if (!d) {
      try {
        const res = await fetch(apiUrl);
        if (res.ok) d = await res.json();
      } catch (e) {}
    }

    if (d && d.pages && d.pages.length > 0) {
      page = d.pages[0]?.data;
      if (page) {
        if (!title) title = page.navTitle || page.about?.title || '';
        if (!quote) {
          quote = (page.about?.shortDescription || page.about?.description || '').replace(/<[^>]+>/g, '').trim();
        }
        const rawDate = page.meta?.releaseDate || page.meta?.customReleaseDate || d.pages?.[0]?._activeDate || d._activeDate;
        if (!releaseDate && rawDate) {
          try {
            const rd = new Date(rawDate);
            releaseDate = rd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          } catch (e) {}
        }
        if (!genre) {
          const foundTags = page.meta?.tags || d.pages?.find(p => p.data?.meta?.tags)?.data?.meta?.tags;
          if (foundTags && Array.isArray(foundTags)) {
            genre = foundTags.map(t => t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())).join(', ');
          }
        }
        if (!developer && page.about?.developerAttribution) developer = page.about.developerAttribution;
        if (!publisher && page.about?.publisherAttribution) publisher = page.about.publisherAttribution;
        if (page.editions?.items && Array.isArray(page.editions.items)) {
          dlcNames = page.editions.items.map(it => it.title).filter(Boolean);
        }
      }
    }
  } catch (e) {}

  // --- Header Image Selection: Compact Small Header (480x270 card) ---
  if (wData?.raw?.keyImages && Array.isArray(wData.raw.keyImages)) {
    const wideItem = wData.raw.keyImages.find(img =>
      img.type === 'OfferImageWide' ||
      img.type === 'DieselStoreFrontWide' ||
      img.type?.toLowerCase().includes('wide')
    );
    if (wideItem) headerImg = wideItem.url;
  }
  if (!headerImg && wData?.headerImage) {
    headerImg = wData.headerImage;
  }
  if (!headerImg && page?.hero?.backgroundImageUrl) {
    headerImg = page.hero.backgroundImageUrl;
  }
  if (!headerImg && wData?.raw?.keyImages && Array.isArray(wData.raw.keyImages)) {
    const thumbItem = wData.raw.keyImages.find(img =>
      img.type === 'Thumbnail' ||
      img.type === 'DieselStoreFrontTall' ||
      img.type === 'OfferImageTall'
    );
    if (thumbItem) headerImg = thumbItem.url;
  }
  if (!headerImg && page) {
    if (page.hero?.logoImage?.src) headerImg = page.hero.logoImage.src;
    else if (page.logoImage?.src) headerImg = page.logoImage.src;
    else if (page.logo?.src) headerImg = page.logo.src;
  }
  if (!headerImg && wData?.raw?.keyImages && Array.isArray(wData.raw.keyImages)) {
    const anyImg = wData.raw.keyImages.find(img => img.url?.startsWith('http'));
    if (anyImg) headerImg = anyImg.url;
  }

  // Format Epic header to compact 480x270 small header (avoid giant 2560x1440 / 1200x1600 images)
  if (headerImg) {
    const clean = headerImg.trim().split('?')[0];
    if (clean.includes('cdn1.epicgames.com') || clean.includes('cdn2.unrealengine.com')) {
      headerImg = clean + '?h=270&resize=1&w=480';
    } else {
      headerImg = clean;
    }
  }

  if (!title) {
    throw new Error('Could not fetch Epic Games Store data. Check the URL or slug & try again.');
  }

  let includedContent = '';
  if (dlcNames.length > 0) {
    includedContent = dlcNames.map(n => n.startsWith('-') ? n : '- ' + n).join('\n');
  }

  return {
    title,
    headerImg,
    quote,
    releaseDate,
    genre,
    developer,
    publisher,
    languages: 'English',
    buildName: title,
    storeUrl: epicStoreUrl,
    buildId: '',
    version: '',
    includedContent
  };
}

/* ===== 4. Fetch itch.io Data from script.js lines 695-870 ===== */
export async function fetchItchData(url, onProgress) {
  if (!url) throw new Error('Please enter an itch.io URL.');

  url = url.trim();
  if (!url.startsWith('http')) url = 'https://' + url;

  onProgress?.('Fetching from itch.io...', 'loading');

  let html = '';
  try {
    html = await fetchViaProxy(url);
  } catch (e) {
    throw new Error('Could not fetch itch.io page. Check the URL & try again.');
  }

  if (!html || html.length < 200) {
    throw new Error('Could not fetch itch.io page. Check the URL & try again.');
  }

  let doc = null;
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new window.DOMParser();
      doc = parser.parseFromString(html, 'text/html');
    } catch (e) {}
  }

  // Helper to extract meta content regardless of attribute order
  function getMeta(propName) {
    const re1 = new RegExp('<meta[^>]+(?:property|name)=["\']' + propName + '["\'][^>]+content=["\']([^"\']*)["\']', 'i');
    const m1 = html.match(re1);
    if (m1) return m1[1];
    const re2 = new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']' + propName + '["\']', 'i');
    const m2 = html.match(re2);
    if (m2) return m2[1];
    return '';
  }

  // ===== TITLE =====
  let title = getMeta('og:title');
  if (!title && doc) {
    const titleEl = doc.querySelector('h1.game_title,h2.game_title,.game_title');
    if (titleEl) title = titleEl.textContent.trim();
  }
  if (!title) {
    const h1Match = html.match(/<h1[^>]*class=["'][^"']*game_title[^"']*["'][^>]*>([^<]+)<\/h1>/i);
    if (h1Match) title = h1Match[1].trim();
  }
  if (!title) {
    const twTitle = getMeta('twitter:title');
    if (twTitle) title = twTitle.replace(/\s+by\s+.*$/i, '').trim();
  }
  if (!title) {
    const docTitle = html.match(/<title>([^<]+)<\/title>/i);
    if (docTitle) title = docTitle[1].replace(/\s+by\s+.*$/i, '').trim();
  }
  if (!title) {
    const segments = url.replace(/\/+$/, '').split('/');
    const slug = segments[segments.length - 1] || 'Unknown';
    title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ===== COVER IMAGE =====
  let cover = '';
  if (doc) {
    const metaImg = doc.querySelector('meta[property="og:image"],meta[name="og:image"],meta[property="twitter:image"],meta[name="twitter:image"]');
    if (metaImg) cover = metaImg.getAttribute('content') || '';
  }
  if (!cover) cover = getMeta('og:image') || getMeta('twitter:image');
  if (!cover && doc) {
    const coverImg = doc.querySelector('.header_image,.game_thumb img,.game_cover img,img.header_widget_game_thumb,.screenshot img');
    if (coverImg) cover = coverImg.src || coverImg.getAttribute('data-src') || '';
  }
  if (!cover) {
    const mItchZone = html.match(/https:\/\/img\.itch\.zone\/[a-zA-Z0-9=+/]+\/(?:original|\d+x\d+[^/]*)\/[a-zA-Z0-9_-]+\.(?:jpg|png|jpeg|webp)/i);
    if (mItchZone) cover = mItchZone[0];
  }
  if (cover && !cover.startsWith('http')) cover = cover.startsWith('//') ? 'https:' + cover : 'https://' + cover;

  // ===== DESCRIPTION =====
  let desc = getMeta('og:description') || getMeta('description') || getMeta('twitter:description');
  if (desc) {
    desc = desc.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
  if ((!desc || desc.length < 20) && doc) {
    const descEl = doc.querySelector('.formatted_description.user_formatted, .formatted_description, .game_description');
    if (descEl) desc = descEl.textContent.replace(/\s+/g, ' ').trim();
  }
  if (desc.length > 350) desc = desc.substring(0, 347).trim() + '...';

  // ===== INFO PANEL DATA =====
  const infoRows = {};
  if (doc) {
    const rows = doc.querySelectorAll('.game_info_panel_widget table tr, table.field_responses tr, .info_panel_wrapper tr');
    rows.forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 2) {
        const key = tds[0].textContent.trim().toLowerCase().replace(/[^a-z]/g, '');
        const valEl = tds[1];
        infoRows[key] = { text: valEl.textContent.trim(), html: valEl.innerHTML };
      }
    });
  }
  // Regex table fallback
  const rowMatches = [...html.matchAll(/<tr>\s*<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
  for (const r of rowMatches) {
    const key = r[1].trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!infoRows[key]) {
      const valHtml = r[2];
      const valText = valHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      infoRows[key] = { text: valText, html: valHtml };
    }
  }

  // ===== GENRE / TAGS =====
  let genre = '';
  if (infoRows['genre']) genre = infoRows['genre'].text;
  if (!genre && infoRows['tags']) genre = infoRows['tags'].text.split('\n').map(s => s.trim()).filter(Boolean).join(', ');
  if (!genre && doc) {
    const tagEls = doc.querySelectorAll('.game_tag_list a.game_tag, .tags a, .game_tag_list a');
    if (tagEls.length > 0) genre = Array.from(tagEls).map(t => t.textContent.trim()).filter(Boolean).join(', ');
  }

  // ===== DEVELOPER / AUTHOR =====
  let author = '';
  if (infoRows['author']) author = infoRows['author'].text;
  if (!author && infoRows['authors']) author = infoRows['authors'].text;
  if (!author && doc) {
    const bylineEl = doc.querySelector('.game_byline a, .game_byline');
    if (bylineEl) author = bylineEl.textContent.replace(/by/i, '').trim();
  }
  if (!author) {
    const subMatch = url.match(/^https?:\/\/([^.]+)\.itch\.io/i);
    if (subMatch) author = subMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ===== RELEASE DATE =====
  let relDate = '';
  if (infoRows['published']) {
    const abbrM = infoRows['published'].html.match(/<abbr[^>]*title="([^"]+)"/);
    if (abbrM) relDate = abbrM[1].split('@')[0].trim();
    else relDate = infoRows['published'].text;
  }
  if (!relDate && infoRows['releasedate']) relDate = infoRows['releasedate'].text;
  if (!relDate && infoRows['updated']) {
    const abbrM = infoRows['updated'].html.match(/<abbr[^>]*title="([^"]+)"/);
    if (abbrM) relDate = abbrM[1].split('@')[0].trim();
  }
  if (!relDate && doc) {
    const abbrEls = doc.querySelectorAll('abbr[title]');
    for (let ab of abbrEls) {
      const t = ab.getAttribute('title');
      if (t && t.match(/\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s*\d{4}/)) {
        relDate = t.split('@')[0].trim();
        break;
      }
    }
  }

  // ===== LANGUAGES =====
  let lang = '';
  if (infoRows['languages']) {
    const langs = infoRows['languages'].text.split(',').map(s => s.trim()).filter(Boolean);
    lang = langs.length <= 1 ? (langs[0] || 'English') : 'MULTi' + langs.length;
  } else {
    lang = 'English';
  }

  // ===== VERSION =====
  let version = '';
  const uvM = html.match(/<div class="?user_version["']?>([^<]+)<\/div>/i);
  if (uvM) version = uvM[1].trim();
  if (!version) {
    const uploadMatches = html.match(/upload_name[^>]*>([^<]+)</g);
    if (uploadMatches) {
      for (let u of uploadMatches) {
        const vm = u.match(/[vV]?(\d+\.\d+(?:\.\d+)?[\w.-]*)/);
        if (vm) {
          version = vm[1];
          break;
        }
      }
    }
  }
  if (!version && infoRows['version']) version = infoRows['version'].text;

  return {
    title,
    headerImg: cover,
    quote: desc,
    releaseDate: relDate,
    genre,
    developer: author,
    publisher: author,
    languages: lang,
    version,
    buildName: title,
    storeUrl: url,
    buildId: '',
    includedContent: ''
  };
}
