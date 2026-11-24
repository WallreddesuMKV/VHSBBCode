import { NextResponse } from 'next/server';
import { requireVerifiedUser } from '../../../utils/requireAuth';

export async function POST(request) {
  try {
    const { response: authError } = await requireVerifiedUser();
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') || formData.get('source') || formData.get('image');
    let apiKey = formData.get('apiKey') || formData.get('key') || request.headers.get('x-api-key') || process.env.PTSCREENS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PTScreens API key is missing. Set your key in Account > API Keys.' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided for upload.' },
        { status: 400 }
      );
    }

    // Prepare multipart payload for Chevereto API v4 (ptscreens.com)
    const uploadBody = new FormData();
    uploadBody.append('source', file);
    uploadBody.append('key', apiKey.trim());
    uploadBody.append('format', 'json');

    const res = await fetch('https://ptscreens.com/api/1/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey.trim()
      },
      body: uploadBody
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.status_code !== 200 || !data.image) {
      const errMsg = data?.error?.message || data?.status_txt || `Upload failed with status ${res.status}`;
      return NextResponse.json({ error: errMsg }, { status: res.ok ? 400 : res.status });
    }

    // Direct original image link (e.g. https://img.ptscreen.com/... or data.image.url)
    const directUrl = data.image.url || data.image.display_url;

    return NextResponse.json({
      success: true,
      url: directUrl,
      viewerUrl: data.image.url_viewer || directUrl,
      name: data.image.name,
      extension: data.image.extension
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
