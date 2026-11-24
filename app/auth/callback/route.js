import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  getDiscordGuildId,
  sanitizeNextPath,
  verifyDiscordGuildMember,
} from '../../utils/discordAuth';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const safeNext = sanitizeNextPath(searchParams.get('next'));

  const redirectLogin = (errorCode) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorCode)}`);

  if (!code) {
    return redirectLogin('oauth_failed');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectLogin('server_config');
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.session || !data?.user) {
    return redirectLogin('oauth_failed');
  }

  const { session, user } = data;
  const guildId = getDiscordGuildId();

  if (!serviceRoleKey) {
    await supabase.auth.signOut();
    return redirectLogin('server_config');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const verification = await verifyDiscordGuildMember(session.provider_token, { guildId });

  if (!verification.ok) {
    // Revoke any prior verification stamp and clear session immediately
    await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        guild_verified: false,
        guild_id: guildId,
        roles: verification.roles,
        verified_at: new Date().toISOString(),
      },
    }).catch(() => {});
    await supabase.auth.signOut();
    return redirectLogin(verification.reason);
  }

  const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      guild_verified: true,
      guild_id: guildId,
      roles: verification.roles,
      verified_at: new Date().toISOString(),
    },
  });

  if (updateErr) {
    await supabase.auth.signOut();
    return redirectLogin('server_config');
  }

  // Refresh session so the newly stamped app_metadata is embedded in the active JWT cookie
  await supabase.auth.refreshSession();

  return NextResponse.redirect(`${origin}${safeNext}`);
}
