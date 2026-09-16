import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('image');
    let apiKey = formData.get('apiKey') || formData.get('key') || request.headers.get('x-api-key') || process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ImgBB API key is missing. Set your key in Account > API Keys.' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided for upload.' },
        { status: 400 }
      );
    }

    const uploadBody = new FormData();
    uploadBody.append('image', file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`, {
      method: 'POST',
      body: uploadBody
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.success || !data.data) {
      const errMsg = data?.error?.message || `ImgBB upload failed with status ${res.status}`;
      return NextResponse.json({ error: errMsg }, { status: res.ok ? 400 : res.status });
    }

    // Direct embed/image URL (e.g. https://i.ibb.co.com/... or https://i.ibb.co/...)
    const directUrl = data.data.url || data.data.display_url;

    return NextResponse.json({
      success: true,
      url: directUrl,
      viewerUrl: data.data.url_viewer || directUrl,
      deleteUrl: data.data.delete_url,
      title: data.data.title
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
