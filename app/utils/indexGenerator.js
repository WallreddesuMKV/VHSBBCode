export const INDEX_HEADER_BBCODE =
  '[size=200]VHS TAPE Releases A-Z[/size]\r\n' +
  '[b]Info: This Topic Will be Updated every once in a week, you can find all of our releases at this single topic.[/b]';

export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '-')
    .replace(/&hellip;/g, '…');
}

export function parseForumTopics(html) {
  if (!html) return [];
  const regex = /<a\s+href="(?:\.\/)?viewtopic\.php\?t=(\d+)[^"]*"\s+class="topictitle">([^<]+)<\/a>/g;
  let m;
  const topics = [];
  while ((m = regex.exec(html)) !== null) {
    const id = m[1];
    const rawTitle = decodeHtmlEntities(m[2]).trim();
    // Exclude the Releases Index announcement topic itself (id 435 or matching name)
    if (id === '435' || /releases\s+index/i.test(rawTitle)) {
      continue;
    }
    topics.push({ id, title: rawTitle });
  }
  return topics;
}

export function parseForumPagination(html) {
  if (!html) return { totalTopics: 0, perPage: 25, totalPages: 1 };
  const countMatch = html.match(/(\d+)\s+topics/);
  const totalTopics = countMatch ? parseInt(countMatch[1], 10) : 0;
  const perPageMatch = html.match(/data-per-page="(\d+)"/);
  const perPage = perPageMatch ? parseInt(perPageMatch[1], 10) : 25;
  const totalPages = totalTopics > 0 ? Math.ceil(totalTopics / perPage) : 1;
  return { totalTopics, perPage, totalPages };
}

export function formatSectionBBCode(key, topics) {
  const header = `[b][size=150][ ${key} ][/size][/b]`;
  const lines = topics.map(
    t => `[url=https://vhstaperepacks.com/viewtopic.php?t=${t.id}]${t.title}[/url]`
  );
  return [header, ...lines].join('\r\n');
}

export function groupAndFormatTopics(topics, options = {}) {
  // Deduplicate by ID
  const map = new Map();
  for (const t of topics) {
    if (!map.has(t.id)) {
      map.set(t.id, t);
    }
  }
  const uniqueTopics = Array.from(map.values());

  // Group topics: '#' for non-letters, and 'A'-'Z'
  const groups = {};
  for (const t of uniqueTopics) {
    const firstChar = t.title[0]?.toUpperCase() || '#';
    const groupKey = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(t);
  }

  // Section order: '#' first, then 'A'-'Z'
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  });

  // ponytail: phpBB returns topics pre-sorted by subject via &sk=s&sd=a.
  // Preserve that order unless options.sort is explicitly requested.
  if (options.sort) {
    for (const k of keys) {
      groups[k].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
      );
    }
  }

  // Build separate BBCode per category (#, A, B, C, ...)
  const sectionBBCodes = {};
  for (const k of keys) {
    sectionBBCodes[k] = formatSectionBBCode(k, groups[k]);
  }

  return {
    headerBBCode: options.includeHeader ? INDEX_HEADER_BBCODE : '',
    sectionBBCodes,
    groups,
    totalTopics: uniqueTopics.length,
    sectionKeys: keys,
  };
}

export async function fetchForumIndex({
  forumUrl = 'https://vhstaperepacks.com/viewforum.php?f=6',
  maxPages = null,
  startPage = 1,
  includeHeader = false,
  concurrency = 6,
} = {}) {
  let f = 6;
  try {
    const parsed = new URL(forumUrl);
    if (parsed.hostname !== 'vhstaperepacks.com' && !parsed.hostname.endsWith('.vhstaperepacks.com')) {
      throw new Error('Only vhstaperepacks.com forum URLs are supported.');
    }
    const paramF = parsed.searchParams.get('f');
    if (paramF && /^\d+$/.test(paramF)) f = parseInt(paramF, 10);
  } catch (e) {
    if (e.message?.includes('vhstaperepacks.com')) throw e;
  }

  const safeStart = Math.max(1, parseInt(startPage, 10) || 1);
  const safeMax = maxPages ? Math.max(1, Math.min(100, parseInt(maxPages, 10) || 1)) : null;
  const baseUrl = `https://vhstaperepacks.com/viewforum.php?f=${f}&sk=s&sd=a`;
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

  const p1Res = await fetch(baseUrl, { headers });
  if (!p1Res.ok) {
    throw new Error(`Failed to fetch forum: HTTP ${p1Res.status}`);
  }
  const p1Html = await p1Res.text();
  const pagination = parseForumPagination(p1Html);
  const perPage = pagination.perPage || 25;

  const totalPagesInForum = pagination.totalPages || 1;
  const targetEndPage = safeMax
    ? Math.min(safeStart + safeMax - 1, totalPagesInForum)
    : totalPagesInForum;

  const pagesToFetch = [];
  for (let p = safeStart; p <= targetEndPage; p++) {
    pagesToFetch.push({ pageNumber: p, start: (p - 1) * perPage });
  }

  const allPageResults = new Map();
  if (safeStart === 1 && pagesToFetch.length > 0 && pagesToFetch[0].pageNumber === 1) {
    allPageResults.set(1, parseForumTopics(p1Html));
  }

  const queue = pagesToFetch.filter(p => !allPageResults.has(p.pageNumber));
  let qIdx = 0;

  async function worker() {
    while (qIdx < queue.length) {
      const item = queue[qIdx++];
      const pageUrl = `${baseUrl}&start=${item.start}`;
      try {
        const res = await fetch(pageUrl, { headers });
        if (res.ok) {
          const html = await res.text();
          allPageResults.set(item.pageNumber, parseForumTopics(html));
        } else {
          allPageResults.set(item.pageNumber, []);
        }
      } catch {
        allPageResults.set(item.pageNumber, []);
      }
    }
  }

  if (queue.length > 0) {
    const workers = Array.from(
      { length: Math.min(concurrency, queue.length) },
      () => worker()
    );
    await Promise.all(workers);
  }

  const orderedTopics = [];
  for (let p = safeStart; p <= targetEndPage; p++) {
    const list = allPageResults.get(p) || [];
    orderedTopics.push(...list);
  }

  const formatted = groupAndFormatTopics(orderedTopics, { includeHeader });
  return {
    ...formatted,
    pagination: {
      totalForumTopics: pagination.totalTopics,
      totalPagesInForum,
      fetchedPages: Math.max(0, targetEndPage - safeStart + 1),
    },
  };
}
