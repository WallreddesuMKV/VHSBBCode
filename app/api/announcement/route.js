import path from 'node:path';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireVerifiedUser } from '../../utils/requireAuth';
import {
  ANNOUNCEMENT_SETTING_KEY,
  mapSiteSettingRow,
  normalizeAnnouncement,
  toSiteSettingRow,
} from '../../utils/announcement';
import {
  fetchCrackwatchNews,
  readLocalAnnouncementFile,
  writeLocalAnnouncementFile,
} from '../../utils/announcementStore';

const SETTINGS_TABLE = 'bbcode_site_settings';
const LOCAL_FALLBACK_FILE = path.join(process.cwd(), '.data', 'announcement.json');

// ponytail: module-scope fallback covers local/offline dev when Supabase env vars are absent
let memoryFallback = { message: '', updatedBy: null, updatedAt: null };

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isMissingTableError(error) {
  const code = String(error?.code || '');
  const msg = String(error?.message || '');
  return code === '42P01' || code === 'PGRST205' || msg.includes(SETTINGS_TABLE);
}

async function loadAnnouncement() {
  const db = getServerSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from(SETTINGS_TABLE)
        .select('value, updated_by, updated_at')
        .eq('key', ANNOUNCEMENT_SETTING_KEY)
        .maybeSingle();
      if (!error && data) {
        return mapSiteSettingRow(data);
      }
      return { message: '', updatedBy: null, updatedAt: null };
    } catch {
      return { message: '', updatedBy: null, updatedAt: null };
    }
  }

  const fromDisk = await readLocalAnnouncementFile(LOCAL_FALLBACK_FILE);
  if (fromDisk.message || fromDisk.updatedAt) return fromDisk;
  return memoryFallback;
}

async function saveAnnouncement(record, userSupabase) {
  const normalized = normalizeAnnouncement(record);
  memoryFallback = normalized;

  const hasServiceRole = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const db = hasServiceRole ? getServerSupabase() : userSupabase;

  if (db) {
    const row = toSiteSettingRow(record);
    const { data, error } = await db
      .from(SETTINGS_TABLE)
      .upsert(row, { onConflict: 'key' })
      .select('value, updated_by, updated_at')
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        throw new Error('Table public.bbcode_site_settings not found. Run supabase_site_settings.sql in Supabase SQL Editor.');
      }
      throw new Error(error.message || 'Failed to save announcement to Supabase.');
    }
    return mapSiteSettingRow(data || row);
  }

  try {
    await writeLocalAnnouncementFile(LOCAL_FALLBACK_FILE, normalized);
  } catch { }
  return normalized;
}

export async function GET() {
  const [record, news] = await Promise.all([
    loadAnnouncement(),
    fetchCrackwatchNews(),
  ]);
  return NextResponse.json({ ...record, news }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PUT(request) {
  const { user, supabase, response: authError } = await requireVerifiedUser();
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const username =
    user?.user_metadata?.custom_claims?.global_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email ||
    'Repacker';

  try {
    const saved = await saveAnnouncement(
      {
        message: body?.message ?? '',
        updatedBy: username,
        updatedAt: new Date().toISOString(),
      },
      supabase
    );
    return NextResponse.json({ success: true, ...saved });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save announcement.' },
      { status: 500 }
    );
  }
}
