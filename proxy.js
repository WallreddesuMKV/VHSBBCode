import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isVerifiedUser } from './app/utils/discordAuth';

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/callback') ||
    pathname === '/icon.svg' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed: if Supabase auth is not configured, keep app gated at /login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname === '/login') return NextResponse.next();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'server_config');
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const verified = Boolean(user && isVerifiedUser(user));

  if (pathname === '/login') {
    if (verified) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    const nextTarget = `${pathname}${search}`;
    if (nextTarget && nextTarget !== '/') {
      loginUrl.searchParams.set('next', nextTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (!verified) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icon\\.svg|favicon\\.ico).*)'],
};
