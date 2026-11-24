/* =============================================
   BBCode Generator — JavaScript v6
   — Fixed Steam CORS + itch.io parser
   ============================================= */

const $ = (id) => document.getElementById(id);

/* ===== i18n ===== */
const i18n = {
  en:{
    brand:'BBCode',brand_sub:'REPACK BUILDER',
    nav_steam:'STEAM',nav_gog:'GOG',nav_epic:'EPIC',nav_itch:'ITCH.IO',nav_preview:'PREVIEW',nav_help:'HELP',
    lang_en:'EN',lang_fr:'FR',lang_jp:'JP',
    source_steam:'STEAM',source_gog:'GOG',source_epic:'EPIC',source_itch:'ITCH.IO',
    steam_panel:'Steam Fetch',steam_fetch:'Fetch',
    steam_hint:'Enter a Steam App ID and click Fetch to auto-fill game info.',
    gog_panel:'GOG Fetch',gog_fetch:'Fetch',
    gog_hint:'Paste a GOG game URL or product ID and click Fetch.',
    epic_panel:'Epic Games Fetch',epic_fetch:'Fetch',
    epic_hint:'Paste an Epic Games Store product URL or slug and click Fetch.',
    itch_panel:'itch.io Fetch',itch_fetch:'Fetch',
    itch_hint:'Paste an itch.io game page URL and click Fetch.',
    game_info:'GAME INFO',repack_info:'REPACK INFO',
    download_links:'DOWNLOAD LINKS',links_hint:'Add download links manually. Each link needs label text and optional URL.',
    add_link:'Add Link',custom_note:'CUSTOM NOTE',
    note_text_label:'Note content (BBCode supported)',note_link_url:'Note link URL (inside [note])',
    include_note:'Include note in output',
    generate_btn:'Generate BBCode',clear_btn:'Clear',example_btn:'Load Example',
    output:'BBCODE OUTPUT',copy_btn:'Copy',preview_btn:'Preview',output_hint:'Output updates live. Click Copy to use in your forum post.',
    auto:'Auto',manual:'Manual',manual_opt:'Manual · Optional',auto_manual:'Auto / Manual',
    fetching_steam:'Fetching from Steam API...',fetching_build:'Fetching Build ID from SteamDB / SteamCMD...',
    fetching_dlc:'Fetching Included Content (DLC)...',
    fetching_gog:'Fetching from GOG...',fetching_epic:'Fetching from Epic Games Store...',
    fetching_itch:'Fetching from itch.io...',
    success_steam:'Success! Steam data fetched.',success_steam_partial:'Game info fetched. Build ID not found — input manually if needed.',
    success_gog:'Success! GOG data fetched.',success_epic:'Success! Epic Games Store data fetched.',
    success_itch:'Success! itch.io data fetched.',
    not_found_steam:'Game not found on Steam Store API.',not_found_gog:'Could not fetch GOG data. Check the URL or ID & try again.',
    not_found_epic:'Could not fetch Epic Games Store data. Check the URL or slug & try again.',
    not_found_itch:'Could not fetch itch.io page. Check the URL & try again.',
    enter_appid:'Please enter an App ID.',enter_gog_url:'Please enter a GOG URL or product ID.',
    enter_epic_url:'Please enter an Epic Games URL or slug.',enter_itch_url:'Please enter an itch.io URL.',
    error:'Error: ',copied:'Copied!',
    link_text:'Link Text',link_url:'URL (leave empty for plain [url])',remove:'Remove',
    f_title:'Title',f_header:'Header Image',f_quote:'Description',
    f_imgbox:'Imgbox URL',f_release:'Release Date',f_lang:'Languages',
    f_genre:'Genre',f_dev:'Developer',f_pub:'Publisher',
    f_build:'Build ID',f_buildname:'Based On',f_included:'Included Content',f_store:'Store URL',
    f_source:'Source/Crack',f_repack:'Repack Size',f_final:'Final Size',f_ram:'RAM Required',
    f_version:'Version',lang_single:'Single',lang_multi:'MULTi',
    // Preview labels
    p_release:'RELEASE',p_version:'VERSION',p_credits:'CREDITS',p_posted:'POSTED',
    p_game:'GAME',p_now:'Now',
  },
  fr:{
    brand:'BBCode',brand_sub:'REPACK BUILDER',
    nav_steam:'STEAM',nav_gog:'GOG',nav_epic:'EPIC',nav_itch:'ITCH.IO',nav_preview:'APERÇU',nav_help:'AIDE',
    lang_en:'EN',lang_fr:'FR',lang_jp:'JP',
    source_steam:'STEAM',source_gog:'GOG',source_epic:'EPIC',source_itch:'ITCH.IO',
    steam_panel:'Récupération Steam',steam_fetch:'Récupérer',
    steam_hint:"Entrez un App ID Steam et cliquez sur Récupérer.",
    gog_panel:'Récupération GOG',gog_fetch:'Récupérer',
    gog_hint:"Collez l'URL ou l'ID d'un jeu GOG et cliquez sur Récupérer.",
    epic_panel:'Récupération Epic Games',epic_fetch:'Récupérer',
    epic_hint:"Collez l'URL ou le slug Epic Games et cliquez sur Récupérer.",
    itch_panel:'Récupération itch.io',itch_fetch:'Récupérer',
    itch_hint:"Collez l'URL d'une page itch.io et cliquez sur Récupérer.",
    game_info:'INFO DU JEU',repack_info:'INFO REPACK',
    download_links:'LIENS DE TÉLÉCHARGEMENT',links_hint:'Ajoutez les liens manuellement.',
    add_link:'Ajouter un lien',custom_note:'NOTE PERSONNALISÉE',
    note_text_label:'Contenu de la note (BBCode supporté)',note_link_url:'URL du lien dans la note',
    include_note:'Inclure la note dans le résultat',
    generate_btn:'Générer BBCode',clear_btn:'Effacer',example_btn:'Charger Exemple',
    output:'RÉSULTAT BBCODE',copy_btn:'Copier',preview_btn:'Aperçu',output_hint:'Le résultat se met à jour en direct.',
    auto:'Auto',manual:'Manuel',manual_opt:'Manuel · Optionnel',auto_manual:'Auto / Manuel',
    fetching_steam:"Récupération depuis l'API Steam...",fetching_build:'Récupération Build ID...',
    fetching_dlc:'Récupération du contenu inclus (DLC)...',
    fetching_gog:"Récupération depuis GOG...",fetching_epic:"Récupération depuis Epic Games Store...",
    fetching_itch:'Récupération depuis itch.io...',
    success_steam:'Succès ! Données Steam récupérées.',success_steam_partial:'Infos récupérées. Build ID introuvable.',
    success_gog:"Succès ! Données GOG récupérées.",success_epic:"Succès ! Données Epic Games récupérées.",
    success_itch:'Succès ! Données itch.io récupérées.',
    not_found_steam:"Jeu introuvable sur l'API Steam.",not_found_gog:"Jeu introuvable sur GOG.",
    not_found_epic:"Jeu introuvable sur Epic Games Store.",
    not_found_itch:"Impossible de récupérer la page itch.io.",
    enter_appid:'Veuillez entrer un App ID.',enter_gog_url:"Veuillez entrer une URL ou un ID GOG.",
    enter_epic_url:"Veuillez entrer une URL ou un slug Epic Games.",enter_itch_url:'Veuillez entrer une URL itch.io.',
    error:'Erreur: ',copied:'Copié !',
    link_text:'Texte',link_url:'URL',remove:'Supprimer',
    f_title:'Titre',f_header:"Image d'en-tête",f_quote:'Description',
    f_imgbox:'URL Imgbox',f_release:'Date de sortie',f_lang:'Langues',
    f_genre:'Genre',f_dev:'Développeur',f_pub:'Éditeur',
    f_build:'Build ID',f_buildname:'Basé sur',f_included:'Contenu inclus',f_store:'URL boutique',
    f_source:'Source/Crack',f_repack:'Taille repack',f_final:'Taille finale',f_ram:'RAM requise',
    f_version:'Version',lang_single:'Single',lang_multi:'MULTi',
    p_release:'SORTIE',p_version:'VERSION',p_credits:'CRÉDITS',p_posted:'PUBLIÉ',
    p_game:'JEU',p_now:'Maintenant',
  },
  jp:{
    brand:'BBCode',brand_sub:'リパックビルダー',
    nav_steam:'STEAM',nav_gog:'GOG',nav_epic:'EPIC',nav_itch:'ITCH.IO',nav_preview:'プレビュー',nav_help:'ヘルプ',
    lang_en:'EN',lang_fr:'FR',lang_jp:'JP',
    source_steam:'STEAM',source_gog:'GOG',source_epic:'EPIC',source_itch:'ITCH.IO',
    steam_panel:'Steam取得',steam_fetch:'取得',
    steam_hint:'Steam App IDを入力して「取得」をクリック。',
    gog_panel:'GOG取得',gog_fetch:'取得',
    gog_hint:'GOGゲームURLまたはIDを貼り付けて「取得」をクリック。',
    epic_panel:'Epic Games取得',epic_fetch:'取得',
    epic_hint:'Epic Games StoreのURLまたはスラッグを入力して「取得」をクリック。',
    itch_panel:'itch.io取得',itch_fetch:'取得',
    itch_hint:'itch.ioのゲームページURLを貼り付けて「取得」をクリック。',
    game_info:'ゲーム情報',repack_info:'リパック情報',
    download_links:'ダウンロードリンク',links_hint:'リンクを手動で追加。',
    add_link:'リンク追加',custom_note:'カスタムノート',
    note_text_label:'ノート内容（BBCode対応）',note_link_url:'ノート内リンクURL',
    include_note:'ノートを出力に含める',
    generate_btn:'BBCode生成',clear_btn:'クリア',example_btn:'例を読み込む',
    output:'BBCODE出力',copy_btn:'コピー',preview_btn:'プレビュー',output_hint:'出力はリアルタイム更新。',
    auto:'自動',manual:'手動',manual_opt:'手動 · オプション',auto_manual:'自動 / 手動',
    fetching_steam:'Steam APIから取得中...',fetching_build:'Build ID取得中...',
    fetching_dlc:'含まれるコンテンツ（DLC）取得中...',
    fetching_gog:'GOGから取得中...',fetching_epic:'Epic Games Storeから取得中...',
    fetching_itch:'itch.ioから取得中...',
    success_steam:'成功！Steamデータを取得しました。',success_steam_partial:'ゲーム情報を取得。Build IDが見つかりません。',
    success_gog:'成功！GOGデータを取得しました。',success_epic:'成功！Epic Gamesデータを取得しました。',
    success_itch:'成功！itch.ioデータを取得しました。',
    not_found_steam:'Steam Store APIでゲームが見つかりません。',not_found_gog:'GOGでゲームが見つかりません。',
    not_found_epic:'Epic Games Storeでゲームが見つかりません。',
    not_found_itch:'itch.ioページを取得できません。',
    enter_appid:'App IDを入力してください。',enter_gog_url:'GOGのURLまたはIDを入力してください。',
    enter_epic_url:'Epic GamesのURLまたはスラッグを入力してください。',enter_itch_url:'itch.io URLを入力してください。',
    error:'エラー: ',copied:'コピーしました！',
    link_text:'テキスト',link_url:'URL',remove:'削除',
    f_title:'タイトル',f_header:'ヘッダー画像',f_quote:'説明',
    f_imgbox:'Imgbox URL',f_release:'リリース日',f_lang:'言語',
    f_genre:'ジャンル',f_dev:'開発者',f_pub:'パブリッシャー',
    f_build:'Build ID',f_buildname:'ベース',f_included:'含まれるコンテンツ',f_store:'ストアURL',
    f_source:'ソース/クラック',f_repack:'リパックサイズ',f_final:'最終サイズ',f_ram:'必要RAM',
    f_version:'バージョン',lang_single:'Single',lang_multi:'MULTi',
    p_release:'リリース',p_version:'バージョン',p_credits:'クレジット',p_posted:'投稿',
    p_game:'ゲーム',p_now:'現在',
  }
};

let currentLang='en';
function setLanguage(lang){
  currentLang=lang;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(i18n[lang][k])el.textContent=i18n[lang][k]});
}
document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));

/* ===== Language map ===== */
const langMap={'english':'English','french':'French','german':'German','spanish':'Spanish','italian':'Italian','russian':'Russian','japanese':'Japanese','korean':'Korean','portuguese':'Portuguese','polish':'Polish','dutch':'Dutch','czech':'Czech','danish':'Danish','finnish':'Finnish','hungarian':'Hungarian','norwegian':'Norwegian','romanian':'Romanian','slovak':'Slovak','swedish':'Swedish','thai':'Thai','turkish':'Turkish','brazilian':'Brazilian Portuguese','schinese':'Simplified Chinese','tchinese':'Traditional Chinese','arabic':'Arabic','bulgarian':'Bulgarian','greek':'Greek','ukrainian':'Ukrainian','latam':'Latin American Spanish','vietnamese':'Vietnamese','indonesian':'Indonesian'};

/* ===== Status ===== */
function showStatus(el,msg,type){el.textContent=msg;el.className='status show fade-in '+(type==='success'?'success':type==='error'?'error':'loading')}
function hideStatus(el){el.className='status'}

/* ===== Source switcher ===== */
let currentSource='steam';
function switchSource(src){
  currentSource=src;
  document.querySelectorAll('.source-tab').forEach(t=>t.classList.toggle('active',t.dataset.source===src));
  document.querySelectorAll('.source-panel').forEach(p=>p.classList.toggle('active',p.dataset.source===src));
  const isSteam=src==='steam';
  $('steamOnlyFields').classList.toggle('hidden',!isSteam);
  $('itchOnlyFields').classList.toggle('hidden',isSteam);
  generateBBCode();
  updatePreview();
}
document.querySelectorAll('.source-tab').forEach(t=>t.addEventListener('click',()=>switchSource(t.dataset.source)));

/* ===== CORS Proxies — fallback chain ===== */
async function fetchViaProxy(targetUrl){
  const appidMatch=targetUrl.match(/(?:appids?=|\/app\/)(\d+)/);
  const appid=appidMatch?appidMatch[1]:null;
  const isSteamStore=targetUrl.includes('steampowered.com');
  const proxies=[
    // User's multi-purpose worker proxy
    'https://darkdeadfire95861xyz.wallreddesu.workers.dev/proxy?url='+encodeURIComponent(targetUrl),
    ...(appid&&isSteamStore?[
      'https://d1ceb68d.proxy-8qv.pages.dev/'+appid,
      'https://d1ceb68d.proxy-8qv.pages.dev/?appid='+appid,
    ]:[]),
    'https://cors-get-proxy.sirjosh.workers.dev/?url='+encodeURIComponent(targetUrl),
    'https://api.allorigins.win/raw?url='+encodeURIComponent(targetUrl),
  ];
  for(let i=0;i<proxies.length;i++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),7000);
      const r=await fetch(proxies[i],{method:'GET',signal:controller.signal});
      clearTimeout(timer);
      if(r.ok){
        const text=await r.text();
        if(!text||text.length<50)continue;
        if(text.includes('cf-browser-verification')||text.includes('Just a moment'))continue;
        return text;
      }
    }catch(e){}
  }
  throw new Error('All CORS proxies failed');
}

/* ===== Download link management ===== */
let linkCounter=0;
function addLinkRow(text='',url=''){
  const id=++linkCounter;
  const div=document.createElement('div');
  div.className='link-row fade-in';
  div.dataset.linkId=id;
  div.innerHTML='<div class="link-fields"><input type="text" data-field="linkText" value="'+text.replace(/"/g,'&quot;')+'" placeholder="'+i18n[currentLang].link_text+'" class="mono"><input type="text" data-field="linkUrl" value="'+url.replace(/"/g,'&quot;')+'" placeholder="'+i18n[currentLang].link_url+'" class="mono"></div><button class="remove-link" title="'+i18n[currentLang].remove+'"><svg class="pixel-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" shape-rendering="crispEdges"><rect x="10" y="2" width="4" height="2" fill="#74747c" stroke="#1c1c20" stroke-width="1.2"/><rect x="3" y="4" width="18" height="3" fill="#92929a" stroke="#1c1c20" stroke-width="1.3"/><path d="M5 7l1.5 14h11L19 7H5z" fill="#808088" stroke="#1c1c20" stroke-width="1.5" stroke-linejoin="round"/><line x1="9" y1="9" x2="9.5" y2="18.5" stroke="#1c1c20" stroke-width="1.5"/><line x1="12" y1="9" x2="12" y2="18.5" stroke="#1c1c20" stroke-width="1.5"/><line x1="15" y1="9" x2="14.5" y2="18.5" stroke="#1c1c20" stroke-width="1.5"/></svg></button>';
  div.querySelector('.remove-link').addEventListener('click',()=>{div.remove();generateBBCode();updatePreview()});
  div.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{generateBBCode();updatePreview()}));
  $('linksContainer').appendChild(div);
}
$('addLinkBtn').addEventListener('click',()=>{addLinkRow();generateBBCode();updatePreview()});

/* ===== Steam language logic ===== */
function computeLanguageString(d){
  const sLangs=d.supported_languages||{};
  // supported_languages can be either an object or an HTML string
  if(typeof sLangs==='string'){
    // Parse HTML string like "English<strong>*</strong>, French, German"
    const cleaned=sLangs.replace(/<[^>]+>/g,'').replace(/\*/g,'');
    const langs=cleaned.split(',').map(s=>s.trim()).filter(Boolean);
    if(langs.length<=1)return langs[0]||'English';
    return 'MULTi'+langs.length;
  }
  let lCount=0,lList=[];
  for(let l in sLangs){const v=sLangs[l];if(v===true||(typeof v==='object'&&v&&v.supported!==false)){lCount++;lList.push(l)}}
  const rLangs=lList.map(l=>langMap[l.toLowerCase()]||l);
  if(lCount<=1)return rLangs.length>0?rLangs.join(', '):'English';
  return 'MULTi'+lCount;
}

/* ===== Steam API response parser ===== */
function parseSteamResponse(data,appid){
  if(!data||typeof data!=='object')return null;
  const root=(data.data&&typeof data.data==='object'&&!data.data.name)?data.data:data;
  return root[appid]||
    Object.values(root).find(v=>v?.data?.steam_appid==appid)||
    Object.values(root).find(v=>v&&typeof v==='object'&&v.success)||
    Object.values(root)[0]||
    null;
}

/* ===== Fetch Steam Data (via CORS proxy) ===== */
async function fetchSteamData(appidInput,statusEl,btn){
  const appidMatch=String(appidInput||'').trim().match(/(?:appids?\/|appids?=|\/app\/|^)(\d+)/i)||String(appidInput||'').match(/(\d+)/);
  const appid=appidMatch?appidMatch[1]:String(appidInput||'').trim();
  if(!appid){showStatus(statusEl,i18n[currentLang].enter_appid,'error');return null}
  btn.disabled=true;
  showStatus(statusEl,i18n[currentLang].fetching_steam,'loading');
  try{
    // Steam API doesn't have CORS — must go via proxy
    const steamApiUrl='https://store.steampowered.com/api/appdetails?appids='+appid+'&l=english';
    let jsonText='';
    try{
      jsonText=await fetchViaProxy(steamApiUrl);
    }catch(e){
      showStatus(statusEl,i18n[currentLang].error+'CORS proxy failed. Try again.','error');
      btn.disabled=false;return null;
    }
    let data;
    try{data=JSON.parse(jsonText);}
    catch(e){
      showStatus(statusEl,i18n[currentLang].error+'Invalid response from Steam API.','error');
      btn.disabled=false;return null;
    }
    const game=parseSteamResponse(data,appid);
    if(!game||!game.success){showStatus(statusEl,i18n[currentLang].not_found_steam,'error');btn.disabled=false;return null}
    const d=game.data;
    $('title').value=d.name||'';
    // Header image
    let header=d.header_image||'';
    const hM=header.match(/\/steam\/apps\/(\d+)\/(header[^?]*)/);
    if(hM){
      header='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/'+hM[1]+'/'+hM[2];
      const tM=(d.header_image||'').match(/\?t=(\d+)/);
      if(tM)header+='?t='+tM[1];
    }
    $('headerImg').value=header;
    $('quote').value=d.short_description||d.about_the_game||'';
    $('releaseDate').value=(d.release_date&&d.release_date.date)?d.release_date.date:'';
    $('developer').value=(d.developers||[]).join(', ');
    // Fetch Popular User-Defined Tags from Steam Store / SteamSpy
    let popularTags = [];
    try {
      const spyRes = await fetch('https://steamspy.com/api.php?request=appdetails&appid=' + appid);
      if (spyRes.ok) {
        const spyData = await spyRes.json();
        if (spyData && spyData.tags && typeof spyData.tags === 'object') {
          popularTags = Object.keys(spyData.tags).filter(Boolean);
        }
      }
    } catch(e) {}

    // Fallback to store page HTML tags via proxy if SteamSpy had no tags
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
      } catch(e) {}
    }

    if (popularTags && popularTags.length > 0) {
      const uniqueTags = Array.from(new Set(popularTags)).slice(0, 6);
      $('genre').value = uniqueTags.join(', ');
    } else if (d.genres && Array.isArray(d.genres)) {
      $('genre').value = d.genres.map(g => g.description).join(', ');
    } else {
      $('genre').value = '';
    }
    $('publisher').value=(d.publishers||[]).join(', ');
    $('languages').value=computeLanguageString(d);
    $('buildName').value=d.name||'';
    const slug=d.name?d.name.replace(/\s+/g,'_').replace(/[^\w-]/g,''):'';
    $('storeUrl').value='https://store.steampowered.com/app/'+appid+'/'+(slug?slug+'/':'');
    $('version').value='';

    // Fetch Build ID from SteamCMD / SteamDB
    let buildId='';
    let steamCmdData=null;
    showStatus(statusEl,i18n[currentLang].fetching_build,'loading');
    try{
      const cmdRes=await fetch('https://api.steamcmd.net/v1/info/'+appid);
      if(cmdRes.ok){
        steamCmdData=await cmdRes.json();
        const cmdApp=steamCmdData?.data?.[appid]||(steamCmdData?.data&&Object.values(steamCmdData.data)[0]);
        const bId=cmdApp?.depots?.branches?.public?.buildid;
        if(bId)buildId=String(bId);
      }
    }catch(e){}

    // Fallback to SteamDB depots
    if(!buildId){
      try{
        const html=await fetchViaProxy('https://steamdb.info/app/'+appid+'/depots/');
        const m=html.match(/Latest\s*Build[\s\S]{0,200}?(\d{6,})/i) ||
                html.match(/data-buildid="(\d+)"/) ||
                html.match(/buildid["'\s:=]+(\d{5,})/i) ||
                html.match(/"buildid"\s*:\s*(\d+)/);
        if(m)buildId=m[1];
      }catch(e){}
    }
    // Fallback to SteamDB info
    if(!buildId){
      try{
        const html2=await fetchViaProxy('https://steamdb.info/app/'+appid+'/info/');
        const m2=html2.match(/Public[\s\S]{0,150}?(\d{7,})/i);
        if(m2)buildId=m2[1];
      }catch(e){}
    }
    $('buildId').value=buildId||'';

    // Auto-fetch Included Content (DLCs) - NO LIMITATION
    let dlcIds=[];
    $('includedContent').value='';
    const cmdApp=steamCmdData?.data?.[appid]||(steamCmdData?.data&&Object.values(steamCmdData.data)[0]);
    if(d.dlc&&Array.isArray(d.dlc)&&d.dlc.length>0){
      dlcIds=d.dlc;
    }else if(cmdApp?.extended?.listofdlc){
      dlcIds=String(cmdApp.extended.listofdlc).split(',').map(s=>s.trim()).filter(Boolean);
    }
    if(dlcIds.length>0){
      showStatus(statusEl,(i18n[currentLang].fetching_dlc||'Fetching Included Content...')+' (0/'+dlcIds.length+')','loading');
      try{
        const batchSize=10;
        const dlcResults=[];
        for(let i=0;i<dlcIds.length;i+=batchSize){
          const chunk=dlcIds.slice(i,i+batchSize);
          const chunkResults=await Promise.all(chunk.map(async id=>{
            try{
              const res=await fetchViaProxy('https://store.steampowered.com/api/appdetails?appids='+id+'&l=english');
              const parsed=JSON.parse(res);
              const item=parseSteamResponse(parsed,id);
              return item?.data?.name||null;
            }catch(e){return null;}
          }));
          dlcResults.push(...chunkResults);
          const doneCount=Math.min(i+batchSize,dlcIds.length);
          showStatus(statusEl,(i18n[currentLang].fetching_dlc||'Fetching Included Content...')+' ('+doneCount+'/'+dlcIds.length+')','loading');
        }
        const validNames=dlcResults.filter(Boolean);
        if(validNames.length>0){
          $('includedContent').value=validNames.map(n=>n.startsWith('-')?n:'- '+n).join('\n');
        }
      }catch(e){}
    }

    showStatus(statusEl,buildId?i18n[currentLang].success_steam+' Build ID: '+buildId:i18n[currentLang].success_steam_partial,'success');
    btn.disabled=false;
    switchSource('steam');
    generateBBCode();
    updatePreview();
    return true;
  }catch(err){
    showStatus(statusEl,i18n[currentLang].error+err.message,'error');
    btn.disabled=false;
    return null;
  }
}

/* ===== Fetch GOG Data ===== */
async function fetchGogData(input,statusEl,btn){
  if(!input){showStatus(statusEl,i18n[currentLang].enter_gog_url,'error');return null}
  btn.disabled=true;
  showStatus(statusEl,i18n[currentLang].fetching_gog,'loading');
  try{
    let url=input.trim();
    let productId=/^\d+$/.test(url)?url:null;
    let slug='';
    const m=url.match(/\/game\/([^\/?#]+)/i);
    if(m)slug=m[1];
    else if(!productId&&!url.startsWith('http'))slug=url;

    if(!url.startsWith('http')){
      url=productId?'https://api.gog.com/products/'+productId:'https://www.gog.com/en/game/'+slug;
    }

    let html='';
    let apiData=null;

    if(productId||url.includes('api.gog.com')){
      try{
        const pId=productId||url.match(/products\/(\d+)/)?.[1];
        const res=await fetchViaProxy('https://api.gog.com/products/'+pId+'?expand=description,screenshots');
        apiData=JSON.parse(res);
      }catch(e){}
    }

    if(!apiData){
      try{
        html=await fetchViaProxy(url);
      }catch(e){
        showStatus(statusEl,i18n[currentLang].not_found_gog,'error');
        btn.disabled=false;
        return null;
      }
      const mCard=html.match(/card-product=[\x22'](\d+)[\x22']/);
      if(mCard){
        try{
          const res=await fetchViaProxy('https://api.gog.com/products/'+mCard[1]+'?expand=description,screenshots');
          apiData=JSON.parse(res);
        }catch(e){}
      }
    }

    let title='';
    let headerImg='';
    let quote='';
    let releaseDate='';
    let genre='';
    let developer='';
    let publisher='';
    let languages='English';
    let gogStoreUrl=url.includes('api.gog.com')&&apiData?.slug?'https://www.gog.com/en/game/'+apiData.slug:url;

    // Extract GOG product card logo 960x570 from HTML as requested
    if(html){
      const mLogo960=html.match(/(?:https?:)?\/\/images(?:-\d+)?\.gog-statics\.com\/[a-f0-9]+_product_card_v2_logo_960x570\.[a-z0-9]+/i);
      const mLogoAny=html.match(/(?:https?:)?\/\/images(?:-\d+)?\.gog-statics\.com\/[a-f0-9]+_product_card_v2_logo[^\s"']+/i);
      if(mLogo960){
        headerImg=mLogo960[0].startsWith('http')?mLogo960[0]:'https:'+mLogo960[0];
      }else if(mLogoAny){
        headerImg=mLogoAny[0].startsWith('http')?mLogoAny[0]:'https:'+mLogoAny[0];
      }
    }

    if(apiData){
      title=apiData.title||'';
      if(!headerImg){
        if(apiData.images?.logo2x||apiData.images?.logo){
          const logo=apiData.images.logo2x||apiData.images.logo;
          headerImg=logo.startsWith('//')?'https:'+logo:logo;
        }else if(apiData.images?.background){
          headerImg=apiData.images.background.startsWith('//')?'https:'+apiData.images.background:apiData.images.background;
        }
      }
      if(apiData.description?.lead)quote=apiData.description.lead.replace(/<[^>]+>/g,'').trim();
      if(apiData.release_date){
        try{
          const rd=new Date(apiData.release_date);
          releaseDate=rd.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
        }catch(e){releaseDate=apiData.release_date;}
      }
      if(apiData.languages){
        const lCount=Object.keys(apiData.languages).length;
        languages=lCount>1?'MULTi'+lCount:(Object.values(apiData.languages)[0]||'English');
      }
      if(apiData.links?.product_card)gogStoreUrl=apiData.links.product_card;
    }

    if(html){
      if(!title){
        const mOg=html.match(/<meta property=[\x22']og:title[\x22'] content=[\x22']([^'\x22]+)[\x22']/i);
        if(mOg)title=mOg[1].replace(/\s*-\s*GOG\.com/i,'').replace(/\s*\|\s*GOG\.com/i,'').replace(/^Buy\s+/i,'').trim();
      }
      if(!headerImg){
        const mImg=html.match(/<meta property=[\x22']og:image[\x22'] content=[\x22']([^'\x22]+)[\x22']/i);
        if(mImg)headerImg=mImg[1];
      }
      if(!quote){
        const mDesc=html.match(/<meta property=[\x22']og:description[\x22'] content=[\x22']([^'\x22]+)[\x22']/i);
        if(mDesc)quote=mDesc[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
      }
      const mJsonLd=html.match(/<script type=[\x22']application\/ld\+json[\x22']>([\s\S]*?)<\/script>/i);
      if(mJsonLd){
        try{
          const ld=JSON.parse(mJsonLd[1]);
          if(!title&&ld.name)title=ld.name;
          if(!releaseDate&&ld.releaseDate)releaseDate=ld.releaseDate;
          if(ld.genre)genre=Array.isArray(ld.genre)?ld.genre.join(', '):ld.genre;
          if(ld.author?.name)developer=ld.author.name;
          if(ld.publisher?.name)publisher=ld.publisher.name;
        }catch(e){}
      }
      if(!developer){
        const devMatch=html.match(/href="\/games\?developers=[^"]*"[^>]*>([^<]+)<\/a>/i);
        if(devMatch)developer=devMatch[1].trim();
      }
      if(!publisher){
        const pubMatch=html.match(/href="\/games\?publishers=[^"]*"[^>]*>([^<]+)<\/a>/i);
        if(pubMatch)publisher=pubMatch[1].trim();
      }
      if(!genre){
        const genreMatches=[...html.matchAll(/href="\/games\?genres=[^"]*"[^>]*>([^<]+)<\/a>/gi)];
        if(genreMatches.length>0){
          genre=Array.from(new Set(genreMatches.map(m=>m[1].trim()).filter(Boolean))).join(', ');
        }
      }
      if(!releaseDate){
        const rdMatch=html.match(/Release date:.*?(\d{4}-\d{2}-\d{2})/i)||html.match(/"releaseDate":\s*"([^"]+)"/);
        if(rdMatch){
          try{
            const rd=new Date(rdMatch[1]);
            releaseDate=rd.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
          }catch(e){releaseDate=rdMatch[1];}
        }
      }
    }

    if(!title){
      showStatus(statusEl,i18n[currentLang].not_found_gog,'error');
      btn.disabled=false;
      return null;
    }

    let gogDlc='';
    if(apiData?.dlcs&&Array.isArray(apiData.dlcs.products)&&apiData.dlcs.products.length>0){
      gogDlc=apiData.dlcs.products.map(p=>'- '+(p.title||p)).join('\n');
    }

    $('title').value=title||'';
    $('headerImg').value=headerImg||'';
    $('quote').value=quote||'';
    $('releaseDate').value=releaseDate||'';
    $('genre').value=genre||'';
    $('developer').value=developer||'';
    $('publisher').value=publisher||'';
    $('languages').value=languages||'English';
    $('buildName').value=title||'';
    $('storeUrl').value=gogStoreUrl||'';
    $('buildId').value='';
    $('version').value='';
    $('includedContent').value=gogDlc;

    showStatus(statusEl,i18n[currentLang].success_gog,'success');
    btn.disabled=false;
    switchSource('gog');
    generateBBCode();
    updatePreview();
    return true;
  }catch(err){
    showStatus(statusEl,i18n[currentLang].error+err.message,'error');
    btn.disabled=false;
    return null;
  }
}

/* ===== Fetch Epic Games Store Data ===== */
async function fetchEpicData(input,statusEl,btn){
  if(!input){showStatus(statusEl,i18n[currentLang].enter_epic_url,'error');return null}
  btn.disabled=true;
  showStatus(statusEl,i18n[currentLang].fetching_epic,'loading');
  try{
    let url=input.trim();
    let slug='';
    const m=url.match(/\/p\/([^\/?#]+)/i);
    if(m)slug=m[1];
    else slug=url.replace(/^https?:\/\/[^\/]+\//,'').replace(/^\/+/,'').replace(/\/+$/,'');

    const epicStoreUrl=url.startsWith('http')?url:'https://store.epicgames.com/en-US/p/'+slug;

    let title='';
    let headerImg='';
    let quote='';
    let releaseDate='';
    let genre='';
    let developer='';
    let publisher='';
    let dlcNames=[];
    let page=null;
    let wData=null;

    // 1. Query user's dedicated worker endpoint for Epic by slug
    try{
      const wRes=await fetch('https://darkdeadfire95861xyz.wallreddesu.workers.dev/epic/'+encodeURIComponent(slug));
      if(wRes.ok){
        wData=await wRes.json();
        if(wData&&wData.success!==false){
          title=wData.title||'';
          quote=wData.description||'';
          if(wData.raw?.developerDisplayName)developer=wData.raw.developerDisplayName;
          if(wData.raw?.publisherDisplayName)publisher=wData.raw.publisherDisplayName;
          if(!developer&&wData.raw?.seller?.name)developer=wData.raw.seller.name;
          if(!publisher&&wData.raw?.seller?.name)publisher=wData.raw.seller.name;
          if(wData.raw?.releaseDate){
            try{
              const rd=new Date(wData.raw.releaseDate);
              releaseDate=rd.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
            }catch(e){}
          }
          if(wData.raw?.tags&&Array.isArray(wData.raw.tags)){
            genre=wData.raw.tags.map(t=>t.name||t).filter(Boolean).join(', ');
          }
        }
      }
    }catch(e){}

    // 2. Fetch or supplement via store-content API via proxy
    try{
      const apiUrl='https://store-content-ipv4.ak.epicgames.com/api/en-US/content/products/'+slug;
      let d=null;
      try{
        const res=await fetchViaProxy(apiUrl);
        d=JSON.parse(res);
      }catch(e){}

      if(!d){
        try{
          const res=await fetch(apiUrl);
          if(res.ok)d=await res.json();
        }catch(e){}
      }

      if(d&&d.pages&&d.pages.length>0){
        page=d.pages[0]?.data;
        if(page){
          if(!title)title=page.navTitle||page.about?.title||'';
          if(!quote){
            quote=(page.about?.shortDescription||page.about?.description||'').replace(/<[^>]+>/g,'').trim();
          }
          const rawDate=page.meta?.releaseDate||page.meta?.customReleaseDate||d.pages?.[0]?._activeDate||d._activeDate;
          if(!releaseDate&&rawDate){
            try{
              const rd=new Date(rawDate);
              releaseDate=rd.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
            }catch(e){}
          }
          if(!genre){
            const foundTags=page.meta?.tags||d.pages?.find(p=>p.data?.meta?.tags)?.data?.meta?.tags;
            if(foundTags&&Array.isArray(foundTags)){
              genre=foundTags.map(t=>t.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())).join(', ');
            }
          }
          if(!developer&&page.about?.developerAttribution)developer=page.about.developerAttribution;
          if(!publisher&&page.about?.publisherAttribution)publisher=page.about.publisherAttribution;
          if(page.editions?.items&&Array.isArray(page.editions.items)){
            dlcNames=page.editions.items.map(it=>it.title).filter(Boolean);
          }
        }
      }
    }catch(e){}

    // --- Header Image Selection: Compact Small Header (480x270 card) ---
    if(wData?.raw?.keyImages&&Array.isArray(wData.raw.keyImages)){
      const wideItem=wData.raw.keyImages.find(img=>
        img.type==='OfferImageWide'||
        img.type==='DieselStoreFrontWide'||
        img.type?.toLowerCase().includes('wide')
      );
      if(wideItem)headerImg=wideItem.url;
    }
    if(!headerImg&&wData?.headerImage){
      headerImg=wData.headerImage;
    }
    if(!headerImg&&page?.hero?.backgroundImageUrl){
      headerImg=page.hero.backgroundImageUrl;
    }
    if(!headerImg&&wData?.raw?.keyImages&&Array.isArray(wData.raw.keyImages)){
      const thumbItem=wData.raw.keyImages.find(img=>
        img.type==='Thumbnail'||
        img.type==='DieselStoreFrontTall'||
        img.type==='OfferImageTall'
      );
      if(thumbItem)headerImg=thumbItem.url;
    }
    if(!headerImg&&page){
      if(page.hero?.logoImage?.src)headerImg=page.hero.logoImage.src;
      else if(page.logoImage?.src)headerImg=page.logoImage.src;
      else if(page.logo?.src)headerImg=page.logo.src;
    }
    if(!headerImg&&wData?.raw?.keyImages&&Array.isArray(wData.raw.keyImages)){
      const anyImg=wData.raw.keyImages.find(img=>img.url?.startsWith('http'));
      if(anyImg)headerImg=anyImg.url;
    }

    // Format Epic header to compact 480x270 small header (avoid giant 2560x1440 / 1200x1600 images)
    if(headerImg){
      const clean=headerImg.trim().split('?')[0];
      if(clean.includes('cdn1.epicgames.com')||clean.includes('cdn2.unrealengine.com')){
        headerImg=clean+'?h=270&resize=1&w=480';
      }else{
        headerImg=clean;
      }
    }

    if(!title){
      showStatus(statusEl,i18n[currentLang].not_found_epic,'error');
      btn.disabled=false;
      return null;
    }

    $('title').value=title||'';
    $('headerImg').value=headerImg||'';
    $('quote').value=quote||'';
    $('releaseDate').value=releaseDate||'';
    $('genre').value=genre||'';
    $('developer').value=developer||'';
    $('publisher').value=publisher||'';
    $('languages').value='English';
    $('buildName').value=title||'';
    $('storeUrl').value=epicStoreUrl||'';
    $('buildId').value='';
    $('version').value='';
    $('includedContent').value=dlcNames.length>0?dlcNames.map(n=>n.startsWith('-')?n:'- '+n).join('\n'):'';

    showStatus(statusEl,i18n[currentLang].success_epic,'success');
    btn.disabled=false;
    switchSource('epic');
    generateBBCode();
    updatePreview();
    return true;
  }catch(err){
    showStatus(statusEl,i18n[currentLang].error+err.message,'error');
    btn.disabled=false;
    return null;
  }
}

/* ===== Fetch itch.io Data (learned from cosmoddd.itch.io/the-norwood-suite) ===== */
async function fetchItchData(url,statusEl,btn){
  if(!url){showStatus(statusEl,i18n[currentLang].enter_itch_url,'error');return null}
  // Normalize URL
  url=url.trim();
  if(!url.startsWith('http'))url='https://'+url;
  btn.disabled=true;
  showStatus(statusEl,i18n[currentLang].fetching_itch,'loading');
  try{
    let html='';
    try{html=await fetchViaProxy(url);}
    catch(e){
      showStatus(statusEl,i18n[currentLang].not_found_itch,'error');
      btn.disabled=false;return null;
    }
    if(!html||html.length<200){
      showStatus(statusEl,i18n[currentLang].not_found_itch,'error');
      btn.disabled=false;return null;
    }

    const parser=new DOMParser();
    const doc=parser.parseFromString(html,'text/html');

    // Helper to extract meta content regardless of attribute order
    function getMeta(propName){
      const re1=new RegExp('<meta[^>]+(?:property|name)=["\']'+propName+'["\'][^>]+content=["\']([^"\']*)["\']','i');
      const m1=html.match(re1);
      if(m1)return m1[1];
      const re2=new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']'+propName+'["\']','i');
      const m2=html.match(re2);
      if(m2)return m2[1];
      return '';
    }

    // ===== TITLE =====
    let title=getMeta('og:title');
    if(!title&&doc){
      const titleEl=doc.querySelector('h1.game_title,h2.game_title,.game_title');
      if(titleEl)title=titleEl.textContent.trim();
    }
    if(!title){
      const h1Match=html.match(/<h1[^>]*class=["'][^"']*game_title[^"']*["'][^>]*>([^<]+)<\/h1>/i);
      if(h1Match)title=h1Match[1].trim();
    }
    if(!title){
      const twTitle=getMeta('twitter:title');
      if(twTitle)title=twTitle.replace(/\s+by\s+.*$/i,'').trim();
    }
    if(!title){
      const docTitle=html.match(/<title>([^<]+)<\/title>/i);
      if(docTitle)title=docTitle[1].replace(/\s+by\s+.*$/i,'').trim();
    }
    if(!title){
      const segments=url.replace(/\/+$/,'').split('/');
      const slug=segments[segments.length-1]||'Unknown';
      title=slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    }
    $('title').value=title;

    // ===== COVER IMAGE =====
    let cover='';
    if(doc){
      const metaImg=doc.querySelector('meta[property="og:image"],meta[name="og:image"],meta[property="twitter:image"],meta[name="twitter:image"]');
      if(metaImg)cover=metaImg.getAttribute('content')||'';
    }
    if(!cover)cover=getMeta('og:image')||getMeta('twitter:image');
    if(!cover&&doc){
      const coverImg=doc.querySelector('.header_image,.game_thumb img,.game_cover img,img.header_widget_game_thumb,.screenshot img');
      if(coverImg)cover=coverImg.src||coverImg.getAttribute('data-src')||'';
    }
    if(!cover){
      const mItchZone=html.match(/https:\/\/img\.itch\.zone\/[a-zA-Z0-9=+/]+\/(?:original|\d+x\d+[^/]*)\/[a-zA-Z0-9_-]+\.(?:jpg|png|jpeg|webp)/i);
      if(mItchZone)cover=mItchZone[0];
    }
    if(cover&&!cover.startsWith('http'))cover=cover.startsWith('//')?'https:'+cover:'https://'+cover;
    $('headerImg').value=cover;

    // ===== DESCRIPTION =====
    let desc=getMeta('og:description')||getMeta('description')||getMeta('twitter:description');
    if(desc){
      desc=desc.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
    }
    if((!desc||desc.length<20)&&doc){
      const descEl=doc.querySelector('.formatted_description.user_formatted, .formatted_description, .game_description');
      if(descEl)desc=descEl.textContent.replace(/\s+/g,' ').trim();
    }
    if(desc.length>350)desc=desc.substring(0,347).trim()+'...';
    $('quote').value=desc;

    // ===== INFO PANEL DATA =====
    const infoRows={};
    if(doc){
      const rows=doc.querySelectorAll('.game_info_panel_widget table tr, table.field_responses tr, .info_panel_wrapper tr');
      rows.forEach(tr=>{
        const tds=tr.querySelectorAll('td');
        if(tds.length>=2){
          const key=tds[0].textContent.trim().toLowerCase().replace(/[^a-z]/g,'');
          const valEl=tds[1];
          infoRows[key]={text:valEl.textContent.trim(),html:valEl.innerHTML};
        }
      });
    }
    // Regex table fallback
    const rowMatches=[...html.matchAll(/<tr>\s*<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
    for(const r of rowMatches){
      const key=r[1].trim().toLowerCase().replace(/[^a-z]/g,'');
      if(!infoRows[key]){
        const valHtml=r[2];
        const valText=valHtml.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
        infoRows[key]={text:valText,html:valHtml};
      }
    }

    // ===== GENRE / TAGS =====
    let genre='';
    if(infoRows['genre'])genre=infoRows['genre'].text;
    if(!genre&&infoRows['tags'])genre=infoRows['tags'].text.split('\n').map(s=>s.trim()).filter(Boolean).join(', ');
    if(!genre&&doc){
      const tagEls=doc.querySelectorAll('.game_tag_list a.game_tag, .tags a, .game_tag_list a');
      if(tagEls.length>0)genre=Array.from(tagEls).map(t=>t.textContent.trim()).filter(Boolean).join(', ');
    }
    $('genre').value=genre;

    // ===== DEVELOPER / AUTHOR =====
    let author='';
    if(infoRows['author'])author=infoRows['author'].text;
    if(!author&&infoRows['authors'])author=infoRows['authors'].text;
    if(!author){
      // Try byline
      const bylineEl=doc.querySelector('.game_byline a, .game_byline');
      if(bylineEl)author=bylineEl.textContent.replace(/by/i,'').trim();
    }
    if(!author){
      // Extract from subdomain: cosmoddd.itch.io → Cosmoddd
      const subMatch=url.match(/^https?:\/\/([^.]+)\.itch\.io/i);
      if(subMatch)author=subMatch[1].replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    }
    $('developer').value=author;
    $('publisher').value=author;

    // ===== RELEASE DATE =====
    let relDate='';
    if(infoRows['published']){
      // Check for abbr title inside
      const abbrM=infoRows['published'].html.match(/<abbr[^>]*title="([^"]+)"/);
      if(abbrM)relDate=abbrM[1].split('@')[0].trim();
      else relDate=infoRows['published'].text;
    }
    if(!relDate&&infoRows['releasedate'])relDate=infoRows['releasedate'].text;
    if(!relDate&&infoRows['updated']){
      const abbrM=infoRows['updated'].html.match(/<abbr[^>]*title="([^"]+)"/);
      if(abbrM)relDate=abbrM[1].split('@')[0].trim();
    }
    if(!relDate){
      // Try any abbr with a date-looking title
      const abbrEls=doc.querySelectorAll('abbr[title]');
      for(let ab of abbrEls){
        const t=ab.getAttribute('title');
        if(t&&t.match(/\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s*\d{4}/)){relDate=t.split('@')[0].trim();break;}
      }
    }
    $('releaseDate').value=relDate;

    // ===== LANGUAGES =====
    let lang='';
    if(infoRows['languages']){
      const langs=infoRows['languages'].text.split(',').map(s=>s.trim()).filter(Boolean);
      lang=langs.length<=1?(langs[0]||'English'):'MULTi'+langs.length;
    }else{
      lang='English'; // itch.io usually English if not specified
    }
    $('languages').value=lang;

    // ===== VERSION =====
    // itch.io stores upload versions in <div class='upload_name'> or similar
    let version='';
    // Try user_version field
    const uvM=html.match(/<div class="?user_version["']?>([^<]+)<\/div>/i);
    if(uvM)version=uvM[1].trim();
    // Also try file names with version patterns
    if(!version){
      const uploadMatches=html.match(/upload_name[^>]*>([^<]+)</g);
      if(uploadMatches){
        for(let u of uploadMatches){
          const vm=u.match(/[vV]?(\d+\.\d+(?:\.\d+)?[\w.-]*)/);
          if(vm){version=vm[1];break;}
        }
      }
    }
    // Try "Version" info row
    $('version').value=version||'';

    // ===== Build ID & Included Content (not applicable for itch.io) =====
    $('buildId').value='';
    $('buildName').value=title||'';
    $('includedContent').value='';

    // ===== Store URL =====
    $('storeUrl').value=url;

    showStatus(statusEl,i18n[currentLang].success_itch,'success');
    btn.disabled=false;
    switchSource('itch');
    generateBBCode();
    updatePreview();
    return true;
  }catch(err){
    showStatus(statusEl,i18n[currentLang].error+err.message,'error');
    btn.disabled=false;
    return null;
  }
}

/* ===== Generate BBCode — matches original .txt exactly ===== */
function generateBBCode(){
  const title=$('title').value||'Game Title';
  const headerImg=$('headerImg').value;
  const quote=$('quote').value;
  const imgboxUrl=$('imgboxUrl').value;
  const releaseDate=$('releaseDate').value;
  const genre=$('genre').value;
  const developer=$('developer').value;
  const publisher=$('publisher').value;
  const buildId=$('buildId').value;
  const buildName=$('buildName').value||title;
  const languages=$('languages').value||'Single';
  const sourceCrack=$('sourceCrack').value;
  const version=$('version').value;
  const repackSize=$('repackSize').value||'N/A';
  const finalSize=$('finalSize').value||'N/A';
  const ramRequired=$('ramRequired').value||'N/A';
  const storeUrl=$('storeUrl').value;

  const isSteam=currentSource==='steam';
  let basedOnLine='';
  if(isSteam){
    basedOnLine='[b]Based On: [/b]'+buildName+(buildId?' (Build '+buildId+' )':' ( - )');
  }else{
    if(version){basedOnLine='[b]Based On: [/b]'+buildName+' (Version '+version+' )';}
    else{basedOnLine='[b]Based On: [/b]'+buildName+' ( - )';}
  }

  let b='';
  b+='[center][size=175][b][color=#8040FF]'+title+'[/color][/b][/size]\r\n\r\n';
  if(headerImg)b+='[img]'+headerImg+'[/img]\r\n';
  if(quote)b+='[size=105][quote]'+quote+'[/quote][/size]\r\n';
  if(imgboxUrl)b+='\r\n[img]'+imgboxUrl+'[/img]\r\n\r\n\r\n';
  else b+='\r\n\r\n';

  b+='[size=145][b][color=#8040FF][u]\u2727 Game Info \u2727[/u][/color][/b][/size]\r\n\r\n';
  b+='[size=105]';
  b+=basedOnLine+'\r\n';
  b+='[b]Release Date: [/b]'+releaseDate+'\r\n';
  b+='[b]Genre: [/b]'+genre+'\r\n';
  b+='[b]Developer:[/b] '+developer+'\r\n';
  b+='[b]Publisher:[/b] '+publisher+'\r\n';
  b+='[b]Languages: [/b]'+languages+'\r\n';
  b+='[b]Source/Crack: [/b]'+sourceCrack+'\r\n';

  b+='\r\n[size=145][b][color=#8040FF][u]\u2727 Repack Info \u2727[/u][/color][/b][/size]\r\n\r\n';
  b+='[b]Repack Size: [/b]'+repackSize+'\r\n';
  b+='[b]Final Size: [/b]'+finalSize+'\r\n';
  b+='[b]RAM Required: [/b]'+ramRequired+'\r\n';

  if(storeUrl){
    b+='\r\n\r\n[b]Store: [/b][url='+storeUrl+']'+storeUrl+'[/url]\r\n';
  }

  const includedContent=$('includedContent')?$('includedContent').value.trim():'';
  if(includedContent){
    const lines=includedContent.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const formattedLines=lines.join('\r\n');
    if(formattedLines){
      b+='\r\n\r\n[size=145][b][color=#8040FF][u]\u2727 Included Content \u2727[/u][/color][/b][/size]\r\n\r\n';
      b+='[size=105][size=95]'+formattedLines+'[/size][/size]\r\n\r\n\r\n';
    }
  }

  b+='\r\n[color=#BF0000][b]100% Lossless & MD5 Perfect: all files are identical to originals after installation[/b][/color]\r\n\r\n[/size]\r\n\r\n\r\n';

  b+='[size=145][b][color=#8040FF]Download Links[/color][/b][/size]\r\n\r\n';
  const linkRows=document.querySelectorAll('#linksContainer > div');
  linkRows.forEach(row=>{
    const text=row.querySelector('[data-field=linkText]').value||'';
    const url=row.querySelector('[data-field=linkUrl]').value||'';
    if(!text&&!url)return;
    if(url)b+='[size=105][url='+url+'][color=#FFFFFF]'+(text||url)+'[/color][/url][/size]\r\n';
    else b+='[size=105][url][color=#FFFFFF]'+(text||'Link')+'[/color][/url][/size]\r\n';
  });

  b+='\r\n\r\n';

  if($('noteEnabled').checked){
    const noteText=$('noteText').value.trim();
    const noteLinkUrl=$('noteLinkUrl').value.trim();
    if(noteText){
      const cleanNote=noteText.replace(/\r?\n/g,'\r\n');
      b+='[size=110][note]';
      if(noteLinkUrl)b+=cleanNote+' [url='+noteLinkUrl+'](note)[/url][/note][/size]\r\n\r\n\r\n';
      else b+=cleanNote+'[/note][/size]\r\n\r\n\r\n';
    }
  }

  b+='[b][color=#8040FF]IF YOU LIKE THIS GAME PLEASE SUPPORT THE DEVELOPERS & BUY IT![/color][/b]\r\n';
  b+='[/center]';
  $('output').value=b;
  return b;
}

/* ===== Update Preview Panel (GameBounty-style right side) ===== */
function updatePreview(){
  const previewTitleEl=$('previewTitle');
  if(!previewTitleEl)return;
  const isSteam=currentSource==='steam';
  const title=$('title').value||'Game Title';
  const developer=$('developer').value||'—';
  const publisher=$('publisher').value||'—';
  const buildId=$('buildId').value;
  const version=$('version').value;
  const sourceCrack=$('sourceCrack').value||'—';
  const repackSize=$('repackSize').value||'—';
  const finalSize=$('finalSize').value||'—';
  const genre=$('genre').value||'—';
  const releaseDate=$('releaseDate').value||'—';
  const languages=$('languages').value||'—';
  const storeUrl=$('storeUrl').value;

  let versionDisplay='';
  if(isSteam)versionDisplay=buildId?'Build '+buildId:'-';
  else versionDisplay=version?'Version '+version:'-';

  const sourceNames={steam:'Steam',gog:'GOG',epic:'Epic Games',itch:'itch.io'};

  $('previewTitle').textContent=title;
  $('previewGenre').textContent=genre;
  $('previewVersion').textContent=versionDisplay;
  $('previewCredits').textContent=sourceCrack;
  $('previewReleaseDate').textContent=releaseDate;
  $('previewLanguages').textContent=languages;
  $('previewDev').textContent=developer;
  $('previewPub').textContent=publisher;
  $('previewSize').textContent=repackSize+(finalSize&&finalSize!=='—'?' / '+finalSize:'');
  $('previewSource').textContent=sourceNames[currentSource]||'Steam';
  const storeLinkEl=$('previewStoreLink');
  if(storeUrl){storeLinkEl.href=storeUrl;storeLinkEl.textContent=(sourceNames[currentSource]||'Store')+' ↗';}
  else storeLinkEl.textContent='—';

  const incContent=$('includedContent')?$('includedContent').value.trim():'';
  const previewIncRow=$('previewIncludedRow');
  const previewIncEl=$('previewIncluded');
  if(previewIncRow&&previewIncEl){
    if(incContent){
      previewIncRow.style.display='';
      const count=incContent.split('\n').map(l=>l.trim()).filter(Boolean).length;
      previewIncEl.textContent=count+' item'+(count>1?'s':'');
    }else{
      previewIncRow.style.display='none';
    }
  }
}

/* ===== Load Example ===== */
function loadExample(){
  $('appid').value='3500390';
  if($('gogUrl'))$('gogUrl').value='';
  if($('epicUrl'))$('epicUrl').value='';
  $('itchUrl').value='';
  $('title').value='Mega Man Star Force Legacy Collection';
  $('headerImg').value='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3500390/81670785247923be3f05dad43452f84c6ec974ea/header.jpg?t=1788912796';
  $('quote').value='The Mega Man Star Force series, which expanded into an anime, is back in the Mega Man Star Force Legacy Collection! This collection includes seven games and additional features like a gallery of illustrations and music! Online play is also supported!';
  $('imgboxUrl').value='https://img.ptscreens.com/3500390_VHSTaPE.png';
  $('releaseDate').value='26 Mar, 2026';
  $('genre').value='Action, RPG, Strategy';
  $('developer').value='CAPCOM Co., Ltd.';
  $('publisher').value='CAPCOM Co., Ltd.';
  $('buildId').value='23297979';
  $('buildName').value='Mega Man Star Force Legacy Collection';
  $('languages').value='MULTi4';
  $('version').value='';
  if($('includedContent'))$('includedContent').value='MMSFC Game Launch Entitlement DLC\nMega Man Star Force Legacy Collection – Sonia Strumm and Luna Platz Character Model Pack\nMega Man Star Force Legacy Collection – Mega Man Battle Network Series BGM\nMega Man Star Force Legacy Collection – Geo Stelar and Omega-Xis Character Model Pack\nMEGAMAN STAR FORCE Legacy Collection Original Soundtrack';
  $('sourceCrack').value='TENOKE';
  $('repackSize').value='5.83 GB';
  $('finalSize').value='7.65 GB';
  $('ramRequired').value='4 GB during installation';
  $('storeUrl').value='https://store.steampowered.com/app/3500390/Mega_Man_Star_Force_Legacy_Collection/';
  $('noteText').value="[color=#BF0000][b]ACHTUNG!![/b][/color]\r\nCheck the repack size before downloading, a real repack ain't gonna be some small mb file";
  $('noteLinkUrl').value='https://www.reddit.com/r/CrackSupport/s/swutlZ210';
  $('noteEnabled').checked=true;
  $('linksContainer').innerHTML='';linkCounter=0;
  addLinkRow('Main Links (Filecrypt)','https://ouo.io/xSRNXKA');
  addLinkRow('Mirror (Pearcrypt)','https://ouo.io/JYmuYI');
  switchSource('steam');
  generateBBCode();
  updatePreview();
}

/* ===== Clear Form ===== */
function clearForm(){
  ['appid','gogUrl','epicUrl','itchUrl','title','headerImg','quote','imgboxUrl','releaseDate','languages','genre','developer','publisher','buildId','buildName','version','includedContent','storeUrl','sourceCrack','repackSize','finalSize','ramRequired','noteText','noteLinkUrl','output'].forEach(id=>{
    if($(id))$(id).value='';
  });
  $('noteEnabled').checked=true;
  $('linksContainer').innerHTML='';linkCounter=0;
  hideStatus($('steamFetchStatus'));
  if($('gogFetchStatus'))hideStatus($('gogFetchStatus'));
  if($('epicFetchStatus'))hideStatus($('epicFetchStatus'));
  hideStatus($('itchFetchStatus'));
  updatePreview();
}

/* ===== BBCode to HTML Parser for Forum Preview ===== */
function renderBBCodeToHtml(bbcode) {
  if (!bbcode || !bbcode.trim()) {
    return '<div style="color:var(--text-muted);text-align:center;padding:40px 10px;">No BBCode generated yet. Fill the form and click Generate BBCode.</div>';
  }

  // Escape HTML entities for security
  let html = bbcode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // [center]...[/center]
  html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="forum-center">$1</div>');

  // [quote]...[/quote]
  html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<div class="forum-quote"><div class="forum-quote-title">Quote:</div><div class="forum-quote-body">$1</div></div>');

  // [note]...[/note]
  html = html.replace(/\[note\]([\s\S]*?)\[\/note\]/gi, '<div class="forum-note"><div class="forum-note-header"><span>⚠</span> NOTE</div><div class="forum-note-body">$1</div></div>');

  // [size=X]...[/size] (relative scaling from base ~13.5px)
  html = html.replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, (m, size, content) => {
    const s = parseInt(size, 10);
    const px = Math.max(10, Math.min(32, (s / 100 * 13.5))).toFixed(1);
    return `<span style="font-size:${px}px;line-height:1.4;">${content}</span>`;
  });

  // [color=X]...[/color]
  html = html.replace(/\[color=([#a-zA-Z0-9]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1;">$2</span>');

  // [b], [u], [i], [s]
  html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
  html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
  html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');
  html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>');

  // [img]url[/img]
  html = html.replace(/\[img\]\s*([^\[]+?)\s*\[\/img\]/gi, (m, src) => {
    return `<div style="text-align:center;margin:8px 0;"><img src="${src.trim()}" class="forum-img" alt="Forum image" loading="lazy" onerror="this.style.opacity='0.4';this.alt='[Image failed to load]';"></div>`;
  });

  // [url=link]text[/url]
  html = html.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="forum-link">$2</a>');

  // [url]link[/url]
  html = html.replace(/\[url\]\s*([^\[]+?)\s*\[\/url\]/gi, (m, link) => {
    const trimmed = link.trim();
    const href = trimmed.startsWith('http') ? trimmed : '#';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="forum-link">${trimmed}</a>`;
  });

  // Normalize excessive blank lines (max 2 consecutive line breaks)
  html = html.replace(/(?:\r?\n\s*){3,}/g, '\n\n');

  // Convert remaining newlines to <br>
  html = html.replace(/\r?\n/g, '<br>');

  return html;
}

/* ===== BBCode Live Forum Preview Modal Controls ===== */
function openPreviewModal() {
  generateBBCode();
  const bbcode = $('output').value;
  const modal = $('previewModal');
  const contentEl = $('forumRenderedContent');
  if (!modal || !contentEl) return;

  contentEl.innerHTML = renderBBCodeToHtml(bbcode);

  const timeEl = $('forumPostTime');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
  const modal = $('previewModal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

/* ===== Event Listeners ===== */
$('steamFetchBtn').addEventListener('click',async()=>{await fetchSteamData($('appid').value.trim(),$('steamFetchStatus'),$('steamFetchBtn'))});
if($('gogFetchBtn'))$('gogFetchBtn').addEventListener('click',async()=>{await fetchGogData($('gogUrl').value.trim(),$('gogFetchStatus'),$('gogFetchBtn'))});
if($('epicFetchBtn'))$('epicFetchBtn').addEventListener('click',async()=>{await fetchEpicData($('epicUrl').value.trim(),$('epicFetchStatus'),$('epicFetchBtn'))});
$('itchFetchBtn').addEventListener('click',async()=>{await fetchItchData($('itchUrl').value.trim(),$('itchFetchStatus'),$('itchFetchBtn'))});
$('generateBtn').addEventListener('click',()=>{generateBBCode();updatePreview()});
$('clearBtn').addEventListener('click',clearForm);
$('loadExampleBtn').addEventListener('click',()=>{loadExample();generateBBCode();updatePreview()});
$('copyBtn').addEventListener('click',async()=>{
  const text=$('output').value;if(!text)return;
  await navigator.clipboard.writeText(text);
  const btn=$('copyBtn');const orig=btn.innerHTML;
  btn.innerHTML='<svg class="pixel-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" shape-rendering="crispEdges"><path d="M4 12l5 5L20 6" stroke="#4ade80" stroke-width="2.5" stroke-linecap="square"/></svg><span>'+i18n[currentLang].copied+'</span>';
  setTimeout(()=>{btn.innerHTML=orig},2000);
});

// Preview Modal listeners
if ($('navPreviewBtn')) $('navPreviewBtn').addEventListener('click', openPreviewModal);
if ($('previewModalBtn')) $('previewModalBtn').addEventListener('click', openPreviewModal);
if ($('previewModalCloseBtn')) $('previewModalCloseBtn').addEventListener('click', closePreviewModal);
if ($('previewModal')) {
  $('previewModal').addEventListener('click', (e) => {
    if (e.target === $('previewModal')) closePreviewModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('previewModal') && $('previewModal').style.display !== 'none') {
    closePreviewModal();
  }
});
if ($('modalCopyBtn')) {
  $('modalCopyBtn').addEventListener('click', async () => {
    const text = $('output').value;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    const orig = $('modalCopyBtn').textContent;
    $('modalCopyBtn').textContent = i18n[currentLang].copied || 'Copied!';
    setTimeout(() => { $('modalCopyBtn').textContent = orig; }, 2000);
  });
}

// Top nav item click switching
document.querySelectorAll('.nav-item[data-nav]').forEach(btn=>{
  btn.addEventListener('click',()=>switchSource(btn.dataset.nav));
});

// Live update on any input change
document.querySelectorAll('input[type=text], input[type=number], textarea').forEach(el=>{
  el.addEventListener('input',()=>{generateBBCode();updatePreview()});
});
$('noteEnabled').addEventListener('change',()=>{generateBBCode();updatePreview()});

/* ===== Init ===== */
setLanguage('en');
loadExample();
generateBBCode();
updatePreview();
