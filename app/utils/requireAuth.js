import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isVerifiedUser } from './discordAuth';

export async function requireVerifiedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Supabase authentication is not configured on the server.' },
        { status: 503 }
      ),
    };
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Discord sign-in is required.' },
        { status: 401 }
      ),
    };
  }

  if (!isVerifiedUser(user)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Access denied. You must be in the authorized Discord server with the required role.' },
        { status: 403 }
      ),
    };
  }

  return { user, supabase, response: null };
}
