export const MAX_ANNOUNCEMENT_LENGTH = 500;
export const ANNOUNCEMENT_SETTING_KEY = 'login_announcement';

export function normalizeAnnouncement(input = {}) {
  const rawMessage = typeof input === 'string' ? input : (input?.message ?? '');
  const message = String(rawMessage).trim().slice(0, MAX_ANNOUNCEMENT_LENGTH);
  if (!message) {
    return { message: '', updatedBy: null, updatedAt: null };
  }
  const updatedBy = input?.updatedBy ? String(input.updatedBy).trim().slice(0, 80) : null;
  const updatedAt = input?.updatedAt || new Date().toISOString();
  return { message, updatedBy, updatedAt };
}

export function toSiteSettingRow(input = {}) {
  const normalized = normalizeAnnouncement(input);
  const updatedBy = input?.updatedBy ? String(input.updatedBy).trim().slice(0, 80) : normalized.updatedBy;
  const updatedAt = input?.updatedAt || normalized.updatedAt || new Date().toISOString();
  return {
    key: ANNOUNCEMENT_SETTING_KEY,
    value: normalized.message,
    updated_by: updatedBy,
    updated_at: updatedAt,
  };
}

export function mapSiteSettingRow(row) {
  if (!row) return { message: '', updatedBy: null, updatedAt: null };
  return normalizeAnnouncement({
    message: row.value ?? '',
    updatedBy: row.updated_by ?? null,
    updatedAt: row.updated_at ?? null,
  });
}

export function formatCrackwatchItems(rawList, limit = 20) {
  if (!Array.isArray(rawList)) return [];
  const items = [];
  for (const row of rawList) {
    if (items.length >= limit) break;
    const title = String(row?.title || '').trim();
    if (!title) continue;
    const group = String(row?.hacked_groups_en || row?.hacked_groups || '').trim();
    const protection = String(row?.protections || '').trim();
    const crackDate = String(row?.crack_date || '').trim();
    const slug = String(row?.slug || '').trim();
    const steamId = row?.steam_prod_id ? String(row.steam_prod_id).trim() : '';
    const url = slug
      ? `https://gamestatus.info/${encodeURIComponent(slug)}`
      : (steamId ? `https://store.steampowered.com/app/${encodeURIComponent(steamId)}` : '');

    const metaParts = [];
    if (protection) metaParts.push(protection);
    if (group) metaParts.push(`cracked by ${group}`);
    if (crackDate) metaParts.push(crackDate);
    const meta = metaParts.join(' · ');
    const summary = meta ? `${title} · ${meta}` : title;

    items.push({
      id: String(row?.id || slug || title),
      title,
      group,
      protection,
      crackDate,
      meta,
      url,
      summary,
    });
  }
  return items;
}

export function resolveLoginBanner(record = {}, crackwatchItems = [], index = 0) {
  const clean = String(record?.message || '').trim();
  if (clean) {
    return {
      text: clean,
      title: clean,
      meta: '',
      url: '',
      isAnnouncement: true,
      updatedBy: record?.updatedBy || null,
      updatedAt: record?.updatedAt || null,
    };
  }

  const list = Array.isArray(crackwatchItems) ? crackwatchItems : [];
  if (list.length === 0) {
    return {
      text: '',
      title: '',
      meta: '',
      url: '',
      isAnnouncement: false,
      updatedBy: null,
      updatedAt: null,
    };
  }

  const safeIdx = ((Number(index) || 0) % list.length + list.length) % list.length;
  const item = list[safeIdx];
  const infoParts = [];
  if (item.protection) infoParts.push(item.protection);
  if (item.group) infoParts.push(`cracked by ${item.group}`);
  return {
    text: item.summary || item.title,
    title: item.title,
    meta: item.meta || '',
    info: infoParts.join(' · '),
    crackDate: item.crackDate || '',
    url: item.url || '',
    isAnnouncement: false,
    updatedBy: null,
    updatedAt: null,
  };
}
