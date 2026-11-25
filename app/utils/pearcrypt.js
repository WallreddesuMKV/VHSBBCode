export const PEARCRYPT_SITE_URL = 'https://pearcrypt.lol';
export const PEARCRYPT_API_BASE = 'https://pearcrypt.lol/api/v1';
export const PEARCRYPT_DASHBOARD_API_BASE = 'https://pearcrypt.lol/api';
export const PEARCRYPT_READ_TIMEOUT_MS = 25000;
export const PEARCRYPT_WRITE_TIMEOUT_MS = process.env.VERCEL ? 55000 : 95000;

export function getContainerShareUrl(container) {
  if (!container) return '';
  if (typeof container.url === 'string' && container.url.trim()) return container.url.trim();
  const id = container.id || container.containerId;
  if (id) return `${PEARCRYPT_SITE_URL}/container/${id}`;
  return '';
}

export function parseBulkUrls(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^https?:\/\/\S+/i.test(line));
}

export function buildCreateContainerPayload({ title, description = '', isProtected = false, password = '', mirrors = [] }) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    throw new Error('Container title is required.');
  }

  const cleanPassword = String(password || '').trim();
  if (isProtected && !cleanPassword) {
    throw new Error('Password is required when password protection is enabled.');
  }

  const normalizedMirrors = [];
  for (let i = 0; i < mirrors.length; i++) {
    const mirror = mirrors[i];
    const cleanLinks = (mirror?.links || [])
      .map(link => {
        const url = String(link?.url || '').trim();
        if (!url) return null;
        if (!/^https?:\/\/\S+/i.test(url)) {
          throw new Error(`Invalid URL in mirror "${mirror?.name || `Mirror ${i + 1}`}": ${url}`);
        }
        const entry = { url };
        const fileName = String(link?.fileName || '').trim();
        const fileSize = String(link?.fileSize || '').trim();
        if (fileName) entry.fileName = fileName;
        if (fileSize) entry.fileSize = fileSize;
        return entry;
      })
      .filter(Boolean);

    if (cleanLinks.length > 0) {
      normalizedMirrors.push({
        name: String(mirror?.name || '').trim() || `Mirror ${normalizedMirrors.length + 1}`,
        links: cleanLinks,
      });
    }
  }

  if (normalizedMirrors.length === 0) {
    throw new Error('Add at least one mirror with a valid download URL.');
  }

  const payload = {
    title: cleanTitle,
    isProtected: Boolean(isProtected),
    mirrors: normalizedMirrors,
  };

  const cleanDesc = String(description || '').trim();
  if (cleanDesc) payload.description = cleanDesc;
  if (isProtected) payload.password = cleanPassword;

  return payload;
}

function isHttpsUrl(raw) {
  try {
    return new URL(raw).protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildUpdateContainerPayload({ title, description = '', isProtected = false, password = '', mirrors }) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    throw new Error('Title cannot be empty.');
  }

  const cleanPassword = String(password || '').trim();
  if (isProtected && cleanPassword && cleanPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const payload = {
    title: cleanTitle,
    description: String(description || '').trim(),
    isProtected: Boolean(isProtected),
  };
  if (isProtected && cleanPassword) {
    payload.password = cleanPassword;
  }

  if (Array.isArray(mirrors)) {
    const normalizedMirrors = [];
    for (let i = 0; i < mirrors.length; i++) {
      const mirror = mirrors[i];
      const mirrorLabel = String(mirror?.name || '').trim() || `Mirror ${i + 1}`;
      const rawLines = Array.isArray(mirror?.links)
        ? mirror.links.map(l => (typeof l === 'string' ? l : l?.url || ''))
        : String(mirror?.links || '').split(/\r?\n/);

      const cleanUrls = [];
      for (const rawLine of rawLines) {
        const url = String(rawLine || '').trim();
        if (!url) continue;
        if (!isHttpsUrl(url)) {
          throw new Error(`Invalid URL in mirror "${mirrorLabel}": ${url}. Only https:// URLs are allowed.`);
        }
        cleanUrls.push(url);
      }

      if (cleanUrls.length > 0) {
        normalizedMirrors.push({
          name: String(mirror?.name || '').trim() || `Mirror ${normalizedMirrors.length + 1}`,
          links: cleanUrls.join('\n'),
        });
      }
    }

    if (normalizedMirrors.length === 0) {
      throw new Error('Add at least one mirror with a valid https:// URL.');
    }
    payload.mirrors = normalizedMirrors;
  }

  return payload;
}

async function findRecentlyCreatedContainer(apiBase, apiKey, title, startedAt, timeoutMs) {
  // ponytail: matches by exact title + creation window because Pearcrypt API has no Idempotency-Key header
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${apiBase}/containers`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const list = Array.isArray(json?.data) ? json.data : [];
    const wanted = String(title || '').trim();
    return list.find(c => {
      if (String(c?.title || '').trim() !== wanted) return false;
      const createdMs = Date.parse(c?.created_at || '');
      return Number.isFinite(createdMs) && createdMs >= startedAt - 5000;
    }) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestPearcrypt(method, path, apiKey, body, options = {}) {
  const apiBase = options.apiBase || PEARCRYPT_API_BASE;
  const timeoutMs = options.timeoutMs ?? (method === 'GET' ? PEARCRYPT_READ_TIMEOUT_MS : PEARCRYPT_WRITE_TIMEOUT_MS);
  const reconcileTimeoutMs = options.reconcileTimeoutMs ?? 5000;
  const isCreate = method === 'POST' && path === '/containers' && Boolean(body?.title);
  const startedAt = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    };
    const init = { method, headers, cache: 'no-store', signal: controller.signal };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const res = await fetch(`${apiBase}${path}`, init);
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      if (isCreate && (res.status === 502 || res.status === 504 || res.status === 524)) {
        const recovered = await findRecentlyCreatedContainer(apiBase, apiKey, body.title, startedAt, reconcileTimeoutMs);
        if (recovered) return { status: 201, data: { data: recovered } };
      }

      const errorMsg =
        (typeof json?.error === 'string' && json.error) ||
        (typeof json?.error?.message === 'string' && json.error.message) ||
        (typeof json?.message === 'string' && json.message) ||
        (res.status === 504 || res.status === 524
          ? 'Pearcrypt API request timed out.'
          : `Pearcrypt API error (${res.status})`);
      const status = res.status === 524 ? 504 : res.status;
      return { status, data: { error: errorMsg } };
    }

    return { status: res.status, data: json ?? { success: true } };
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    if (isTimeout && isCreate) {
      const recovered = await findRecentlyCreatedContainer(apiBase, apiKey, body.title, startedAt, reconcileTimeoutMs);
      if (recovered) return { status: 201, data: { data: recovered } };
    }
    return {
      status: isTimeout ? 504 : 502,
      data: { error: isTimeout ? 'Pearcrypt API request timed out.' : (err?.message || 'Pearcrypt request failed.') },
    };
  } finally {
    clearTimeout(timer);
  }
}
