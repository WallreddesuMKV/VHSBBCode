export const PEARCRYPT_SITE_URL = 'https://pearcrypt.lol';
export const PEARCRYPT_API_BASE = 'https://pearcrypt.lol/api/v1';

export function getContainerShareUrl(container) {
  if (!container) return '';
  if (typeof container.url === 'string' && container.url.trim()) return container.url.trim();
  if (container.id) return `${PEARCRYPT_SITE_URL}/container/${container.id}`;
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
        return { url };
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
