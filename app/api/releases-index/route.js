import { NextResponse } from 'next/server';
import { fetchForumIndex } from '../../utils/indexGenerator';
import { requireVerifiedUser } from '../../utils/requireAuth';

export async function POST(request) {
  const { response: authError } = await requireVerifiedUser();
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      forumUrl = 'https://vhstaperepacks.com/viewforum.php?f=6&s',
      maxPages = null,
      startPage = 1,
      includeHeader = false,
    } = body;

    const result = await fetchForumIndex({
      forumUrl,
      maxPages: maxPages ? parseInt(maxPages, 10) : null,
      startPage: startPage ? parseInt(startPage, 10) : 1,
      includeHeader: Boolean(includeHeader),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error generating releases index:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Releases Index from forum.' },
      { status: 500 }
    );
  }
}
