export const DEFAULT_DISCORD_GUILD_ID = '1131170624555982898';
export const DEFAULT_DISCORD_ROLE_ID = '1131170624845389968';
export const DISCORD_OAUTH_SCOPES = 'identify guilds.members.read';

export function getDiscordGuildId() {
  return (process.env.DISCORD_GUILD_ID || DEFAULT_DISCORD_GUILD_ID).trim();
}

export function getAllowedRoleIds() {
  const raw = process.env.DISCORD_ALLOWED_ROLE_IDS || DEFAULT_DISCORD_ROLE_ID;
  return raw
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export async function verifyDiscordGuildMember(
  providerToken,
  {
    guildId = getDiscordGuildId(),
    allowedRoleIds = getAllowedRoleIds(),
    fetchImpl = fetch,
  } = {}
) {
  if (!providerToken || typeof providerToken !== 'string') {
    return { ok: false, reason: 'missing_token', roles: [] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetchImpl(
      `https://discord.com/api/v10/users/@me/guilds/${encodeURIComponent(guildId)}/member`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (res.status === 404) {
      return { ok: false, reason: 'not_in_server', roles: [] };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'discord_scope_error', roles: [] };
    }
    if (!res.ok) {
      return { ok: false, reason: 'discord_api_error', roles: [] };
    }

    const member = await res.json().catch(() => null);
    const roles = Array.isArray(member?.roles) ? member.roles.map(String) : [];
    const hasAllowedRole = allowedRoleIds.some(roleId => roles.includes(roleId));

    if (!hasAllowedRole) {
      return { ok: false, reason: 'missing_role', roles };
    }

    return { ok: true, reason: 'ok', roles };
  } catch {
    return { ok: false, reason: 'discord_api_error', roles: [] };
  } finally {
    clearTimeout(timer);
  }
}

export function isVerifiedUser(
  user,
  guildId = getDiscordGuildId(),
  allowedRoleIds = getAllowedRoleIds()
) {
  const meta = user?.app_metadata;
  if (!meta || meta.guild_verified !== true) return false;
  if (String(meta.guild_id || '') !== String(guildId)) return false;
  const roles = Array.isArray(meta.roles) ? meta.roles.map(String) : [];
  return allowedRoleIds.some(roleId => roles.includes(roleId));
}

export function sanitizeNextPath(raw) {
  if (typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/login')) {
    return '/';
  }
  return trimmed;
}
