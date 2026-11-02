import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fetchForumIndex } from '../../utils/indexGenerator';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Enforce auth when Supabase credentials are configured
  if (supabaseUrl && supabaseAnonKey) {
    let authUser = null;

    // 1. Check Bearer token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data?.user) {
            authUser = data.user;
          }
        } catch (e) {}
      }
    }

    // 2. Check SSR cookies if Bearer token wasn't provided or valid
    if (!authUser) {
      try {
        const cookieStore = await cookies();
        const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {}
          }
        });
        const { data: { session } } = await ssrClient.auth.getSession();
        if (session?.user) {
          authUser = session.user;
        }
      } catch (e) {}
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Releases Index crawler is strictly restricted to authenticated VHSTaPE members only.' },
        { status: 401 }
      );
    }
  } else {
    // When Supabase environment variables are not configured in local environment,
    // still require an authorization header so guest requests cannot crawl.
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Releases Index crawler is strictly restricted to authenticated VHSTaPE members only.' },
        { status: 401 }
      );
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      forumUrl = 'https://vhstaperepacks.com/viewforum.php?f=6&s',
      maxPages = null,
      startPage = 1,
      includeHeader = false
    } = body;

    const result = await fetchForumIndex({
      forumUrl,
      maxPages: maxPages ? parseInt(maxPages, 10) : null,
      startPage: startPage ? parseInt(startPage, 10) : 1,
      includeHeader: Boolean(includeHeader)
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error generating releases index:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Releases Index from forum.' },
      { status: 500 }
    );
  }
}
