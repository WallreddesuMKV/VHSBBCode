export const DEFAULT_PREVIEW_BBCODE = `[center][size=175][b][color=#8040FF]Mega Man Star Force Legacy Collection[/color][/b][/size]

[img]https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3500390/81670785247923be3f05dad43452f84c6ec974ea/header.jpg?t=1788912796[/img]
[size=105][quote]The Mega Man Star Force series, which expanded into an anime, is back in the Mega Man Star Force Legacy Collection! This collection includes seven games and additional features like a gallery of illustrations and music! Online play is also supported![/quote][/size]

[img]https://img.ptscreens.com/3500390_VHSTaPE.png[/img]


[size=145][b][color=#8040FF][u]✧ Game Info ✧[/u][/color][/b][/size]

[size=105][b]Based On: [/b]Mega Man Star Force Legacy Collection (Build 23297979 )
[b]Release Date: [/b]26 Mar, 2026
[b]Genre: [/b]Action, RPG, Strategy
[b]Developer:[/b] CAPCOM Co., Ltd.
[b]Publisher:[/b] CAPCOM Co., Ltd.
[b]Languages: [/b]MULTi4
[b]Source/Crack: [/b]TENOKE

[size=145][b][color=#8040FF][u]✧ Repack Info ✧[/u][/color][/b][/size]

[b]Repack Size: [/b]5.83 GB
[b]Final Size: [/b]7.65 GB
[b]RAM Required: [/b]4 GB during installation


[b]Store: [/b][url=https://store.steampowered.com/app/3500390/Mega_Man_Star_Force_Legacy_Collection/]https://store.steampowered.com/app/3500390/Mega_Man_Star_Force_Legacy_Collection/[/url]


[size=145][b][color=#8040FF][u]✧ Included Content ✧[/u][/color][/b][/size]

[size=105][size=95]MMSFC Game Launch Entitlement DLC
Mega Man Star Force Legacy Collection – Sonia Strumm and Luna Platz Character Model Pack
Mega Man Star Force Legacy Collection – Mega Man Battle Network Series BGM
Mega Man Star Force Legacy Collection – Geo Stelar and Omega-Xis Character Model Pack
MEGAMAN STAR FORCE Legacy Collection Original Soundtrack[/size][/size]



[color=#BF0000][b]100% Lossless & MD5 Perfect: all files are identical to originals after installation[/b][/color]

[/size]


[size=145][b][color=#8040FF]Download Links[/color][/b][/size]

[size=105][url=https://ouo.io/xSRNXKA][color=#FFFFFF]Main Links (Filecrypt)[/color][/url][/size]
[size=105][url=https://ouo.io/JYmuYI][color=#FFFFFF]Mirror (Pearcrypt)[/color][/url][/size]


[size=110][note][color=#BF0000][b]ACHTUNG!![/b][/color]
Check the repack size before downloading, a real repack ain't gonna be some small mb file [url=https://www.reddit.com/r/CrackSupport/s/swutlZ210](note)[/url][/note][/size]


[b][color=#8040FF]IF YOU LIKE THIS GAME PLEASE SUPPORT THE DEVELOPERS & BUY IT![/color][/b]
[/center]`;

function sanitizeUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (trimmed === '#') return '#';
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

function replaceNested(input, regex, replacer) {
  let out = input;
  let prev = '';
  let guard = 0;
  while (out !== prev && guard < 12) {
    prev = out;
    out = out.replace(regex, replacer);
    guard++;
  }
  return out;
}

export function parseBBCode(code) {
  if (!code) return '';
  let html = String(code)
    .replace(/\r\n/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = replaceNested(html, /\[b\]((?:(?!\[b\]|\[\/b\]).)*?)\[\/b\]/gis, '<strong>$1</strong>');
  html = replaceNested(html, /\[i\]((?:(?!\[i\]|\[\/i\]).)*?)\[\/i\]/gis, '<em>$1</em>');
  html = replaceNested(html, /\[u\]((?:(?!\[u\]|\[\/u\]).)*?)\[\/u\]/gis, '<u>$1</u>');
  html = replaceNested(html, /\[center\]((?:(?!\[center\]|\[\/center\]).)*?)\[\/center\]/gis, '<div style="text-align:center">$1</div>');
  html = replaceNested(html, /\[color=([^\]]+)\]((?:(?!\[color=|\[\/color\]).)*?)\[\/color\]/gis, (_, color, text) => {
    const safeColor = /^[#a-zA-Z0-9(),.\s%-]{1,40}$/.test(color.trim()) ? color.trim() : 'inherit';
    return `<span style="color:${safeColor}">${text}</span>`;
  });
  html = replaceNested(html, /\[size=([^\]]+)\]((?:(?!\[size=|\[\/size\]).)*?)\[\/size\]/gis, (_, size, text) => {
    const px = Math.round(parseInt(size, 10) * 0.14) || 14;
    return `<span style="font-size:${px}px">${text}</span>`;
  });

  html = html.replace(/\[img\](.*?)\[\/img\]/gis, (_, url) => {
    const safe = sanitizeUrl(url);
    if (!safe || safe === '#') return '';
    return `<img src="${safe}" referrerpolicy="no-referrer" style="max-width:100%; height:auto; border-radius:4px; margin:10px auto; display:block;" alt="Release Image" />`;
  });

  html = html.replace(/\[url=([^\]]+)\](.*?)\[\/url\]/gis, (_, url, text) => {
    const safe = sanitizeUrl(url);
    if (!safe) return text;
    return `<a href="${safe}" target="_blank" rel="noreferrer" style="color:#ff7a4d; text-decoration:underline;">${text}</a>`;
  });
  html = html.replace(/\[url\](.*?)\[\/url\]/gis, (_, url) => {
    const safe = sanitizeUrl(url);
    if (!safe) return url;
    return `<a href="${safe}" target="_blank" rel="noreferrer" style="color:#ff7a4d; text-decoration:underline;">${safe}</a>`;
  });

  html = replaceNested(
    html,
    /\[quote\]((?:(?!\[quote\]|\[\/quote\]).)*?)\[\/quote\]/gis,
    '<blockquote style="border-left:3px solid #ff6b3d; background:#1c1f26; color:#eceef2; padding:10px 14px; margin:12px 0; border-radius:4px; font-style:italic;">$1</blockquote>'
  );
  html = replaceNested(
    html,
    /\[note=([^\]]+)\]((?:(?!\[note|\[\/note\]).)*?)\[\/note\]/gis,
    '<div style="border:1px solid #8a3f26; background:#291b16; color:#eceef2; padding:12px; margin:12px 0; border-radius:6px;"><div style="color:#ff9b75; font-weight:bold; margin-bottom:4px; text-transform:uppercase; font-size:11px;">NOTE</div><div>$2</div></div>'
  );
  html = replaceNested(
    html,
    /\[note\]((?:(?!\[note|\[\/note\]).)*?)\[\/note\]/gis,
    '<div style="border:1px solid #8a3f26; background:#291b16; color:#eceef2; padding:12px; margin:12px 0; border-radius:6px;"><div style="color:#ff9b75; font-weight:bold; margin-bottom:4px; text-transform:uppercase; font-size:11px;">NOTE</div><div>$1</div></div>'
  );

  html = html.replace(/\n/g, '<br />');
  return html;
}
