import fs from 'node:fs/promises';
import path from 'node:path';
import { formatCrackwatchItems, normalizeAnnouncement } from './announcement.js';

const GAMESTATUS_CRACKED_API = 'https://gamestatus.info/back/api/gameinfo/game/lastcrackedgames/';
const CRACKWATCH_CACHE_TTL_MS = 10 * 60 * 1000;

// ponytail: in-process 10m cache avoids hitting GameStatus on every /login load; upgrade to KV/Redis if multi-region traffic grows
let crackwatchCache = { items: [], fetchedAt: 0 };

export async function readLocalAnnouncementFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeAnnouncement(parsed);
  } catch {
    return { message: '', updatedBy: null, updatedAt: null };
  }
}

export async function writeLocalAnnouncementFile(filePath, record) {
  const normalized = normalizeAnnouncement(record);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

export async function fetchCrackwatchNews({ force = false, timeoutMs = 6000 } = {}) {
  const now = Date.now();
  if (!force && crackwatchCache.items.length > 0 && now - crackwatchCache.fetchedAt < CRACKWATCH_CACHE_TTL_MS) {
    return crackwatchCache.items;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GAMESTATUS_CRACKED_API, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'VHSTaPE-BBCodeGen/1.0',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return crackwatchCache.items;
    const json = await res.json().catch(() => null);
    const items = formatCrackwatchItems(json?.list_crack_games || [], 20);
    if (items.length > 0) {
      crackwatchCache = { items, fetchedAt: now };
    }
    return items;
  } catch {
    return crackwatchCache.items;
  } finally {
    clearTimeout(timer);
  }
}
