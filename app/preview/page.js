'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Link from 'next/link';
import { IconCopy, IconCheck, IconGenerator } from '../components/Icons';

export default function PreviewPage() {
  const [bbcode, setBbcode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('bbcode_active_output');
    if (cached) {
      setBbcode(cached);
    } else {
      setBbcode(`[center][size=175][b][color=#8040FF]Mega Man Star Force Legacy Collection[/color][/b][/size]

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
[/center]`);
    }
  }, []);

  function parseBBCode(code) {
    if (!code) return '';
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>');
    html = html.replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>');
    html = html.replace(/\[u\](.*?)\[\/u\]/gis, '<u>$1</u>');
    html = html.replace(/\[center\](.*?)\[\/center\]/gis, '<div style="text-align:center">$1</div>');
    html = html.replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gis, '<span style="color:$1">$2</span>');
    html = html.replace(/\[size=([^\]]+)\](.*?)\[\/size\]/gis, (m, size, text) => {
      const px = Math.round(parseInt(size, 10) * 0.14) || 14;
      return `<span style="font-size:${px}px">${text}</span>`;
    });
    html = html.replace(/\[img\](.*?)\[\/img\]/gis, '<img src="$1" style="max-width:100%; border-radius:4px; margin:10px auto; display:block;" alt="Release Image" />');
    html = html.replace(/\[url=([^\]]+)\](.*?)\[\/url\]/gis, '<a href="$1" target="_blank" rel="noreferrer" style="color:var(--accent); text-decoration:underline;">$2</a>');
    html = html.replace(/\[url\](.*?)\[\/url\]/gis, '<a href="$1" target="_blank" rel="noreferrer" style="color:var(--accent); text-decoration:underline;">$1</a>');
    html = html.replace(/\[quote\](.*?)\[\/quote\]/gis, '<blockquote style="border-left:3px solid var(--accent); background:var(--surface-2); padding:10px 14px; margin:12px 0; border-radius:4px; font-style:italic;">$1</blockquote>');
    html = html.replace(/\[note=([^\]]+)\](.*?)\[\/note\]/gis, '<div style="border:2px solid var(--accent); background:var(--accent-soft); padding:12px; margin:12px 0; border-radius:6px;"><div style="color:var(--accent); font-weight:bold; margin-bottom:4px; text-transform:uppercase; font-size:11px;">NOTE</div><div>$2</div></div>');
    html = html.replace(/\[note\](.*?)\[\/note\]/gis, '<div style="border:2px solid var(--accent); background:var(--accent-soft); padding:12px; margin:12px 0; border-radius:6px;"><div style="color:var(--accent); font-weight:bold; margin-bottom:4px; text-transform:uppercase; font-size:11px;">NOTE</div><div>$1</div></div>');

    html = html.replace(/\n/g, '<br />');
    return html;
  }

  function handleCopy() {
    navigator.clipboard.writeText(bbcode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleLoadActive() {
    const cached = localStorage.getItem('bbcode_active_output');
    if (cached) {
      setBbcode(cached);
    } else {
      alert('No active output found. Generate a BBCode on the homepage first.');
    }
  }

  return (
    <>
      <Header />
      <main className="main-layout">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-white)' }}>
            Live BBCode Forum Previewer
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="neo-btn neo-btn-subtle" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handleLoadActive}>
              Load Latest from Generator
            </button>
            <Link href="/" className="neo-btn neo-btn-primary" style={{ padding: '6px 14px', fontSize: 11 }}>
              <IconGenerator size={13} />
              Back to Generator
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          {/* Editor */}
          <div className="neo-card">
            <div className="neo-card-header">
              <span className="neo-card-title">
                Raw BBCode Editor
              </span>
              <button
                className="neo-btn neo-btn-subtle"
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={handleCopy}
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="neo-card-body">
              <textarea
                className="mono"
                value={bbcode}
                onChange={e => setBbcode(e.target.value)}
                style={{ height: 600, resize: 'vertical' }}
                placeholder="Paste BBCode here..."
              />
            </div>
          </div>

          {/* Rendered View */}
          <div className="neo-card">
            <div className="neo-card-header">
              <span className="neo-card-title">
                Forum Thread Simulation
              </span>
            </div>
            <div className="neo-card-body">
              <div
                style={{
                  background: 'var(--input-bg)',
                  border: '2px solid var(--border)',
                  borderRadius: 6,
                  padding: 24,
                  minHeight: 580,
                  lineHeight: 1.65,
                  color: 'var(--text)'
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
