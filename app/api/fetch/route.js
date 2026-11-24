import { NextResponse } from 'next/server';
import { requireVerifiedUser } from '../../utils/requireAuth';

export async function GET(request) {
  const { response: authError } = await requireVerifiedUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsedTarget = null;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
  }

  const directJsonHosts = new Set([
    'v3.sg.media-imdb.com',
    'v3-cinemeta.strem.io',
    'query.wikidata.org',
  ]);
  if (parsedTarget.protocol === 'https:' && directJsonHosts.has(parsedTarget.hostname)) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(targetUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BBCodeGen/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) return NextResponse.json(await response.json());
    } catch (e) { }
    return NextResponse.json({ error: 'Metadata lookup failed' }, { status: 502 });
  }

  // Exact proxy chain from script.js
  const appidMatch = targetUrl.match(/(?:appids?=|\/app\/)(\d+)/);
  const appid = appidMatch ? appidMatch[1] : null;
  const isSteamStore = targetUrl.includes('steampowered.com');
  const proxies = [
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

        try {
          const json = JSON.parse(text);
          return NextResponse.json(json);
        } catch (e) {
          return new Response(text, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      }
    } catch (e) { }
  }

  return NextResponse.json({ error: 'All CORS proxies failed' }, { status: 502 });
}
