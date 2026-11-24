import { NextResponse } from 'next/server';
import { PEARCRYPT_API_BASE } from '../../utils/pearcrypt';
import { requireVerifiedUser } from '../../utils/requireAuth';

const SAFE_ID = /^[a-zA-Z0-9_-]{1,128}$/;

function getApiKey(request) {
  return (request.headers.get('x-api-key') || '').trim();
}

function validateId(id) {
  return Boolean(id && SAFE_ID.test(id));
}

async function forward(method, path, apiKey, body) {
  const { user, supabase, response: authError } = await requireVerifiedUser();
  if (authError) return authError;

  let resolvedKey = apiKey;
  if (!resolvedKey && supabase && user) {
    try {
      const { data } = await supabase
        .from('user_api_keys')
        .select('pearcrypt_api_key')
        .eq('user_id', user.id)
        .maybeSingle();
      resolvedKey = String(data?.pearcrypt_api_key || '').trim();
    } catch {}
  }

  if (!resolvedKey) {
    return NextResponse.json(
      { error: 'Pearcrypt API key is required. Configure it in Account > Personal API Keys.' },
      { status: 401 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const headers = {
      Authorization: `Bearer ${resolvedKey}`,
      Accept: 'application/json',
    };
    const init = { method, headers, signal: controller.signal };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const res = await fetch(`${PEARCRYPT_API_BASE}${path}`, init);
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {}

    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error || json?.message || `Pearcrypt API error (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(json ?? { success: true }, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err.name === 'AbortError' ? 'Pearcrypt API request timed out.' : (err.message || 'Pearcrypt request failed.') },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id && !validateId(id)) {
    return NextResponse.json({ error: 'Invalid container ID.' }, { status: 400 });
  }
  const path = id ? `/containers/${id}` : '/containers';
  return forward('GET', path, getApiKey(request));
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  if (action === 'unlock') {
    if (!validateId(id)) {
      return NextResponse.json({ error: 'Valid container ID is required to unlock.' }, { status: 400 });
    }
    return forward('POST', `/containers/${id}/unlock`, getApiKey(request), body);
  }

  return forward('POST', '/containers', getApiKey(request), body);
}

export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!validateId(id)) {
    return NextResponse.json({ error: 'Valid container ID is required.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  return forward('PUT', `/containers/${id}`, getApiKey(request), body);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!validateId(id)) {
    return NextResponse.json({ error: 'Valid container ID is required.' }, { status: 400 });
  }
  return forward('DELETE', `/containers/${id}`, getApiKey(request));
}
