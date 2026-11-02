// test_releases_index.js — Minimal runnable check for Releases Index generator logic
// Adheres to ponytail.md: no frameworks, assert-based, fails if logic breaks.
import assert from 'node:assert';
import {
  decodeHtmlEntities,
  parseForumTopics,
  parseForumPagination,
  groupAndFormatTopics
} from './app/utils/indexGenerator.js';

console.log('--- Running Releases Index Generator Verification Checks ---');

// 1. decodeHtmlEntities test
const rawEntityString = '&lt;b&gt;Dragon&#39;s Dogma &amp; &quot;RePack&quot;&lt;/b&gt;';
const decoded = decodeHtmlEntities(rawEntityString);
assert.strictEqual(decoded, '<b>Dragon\'s Dogma & "RePack"</b>', 'HTML entity decode mismatch');
console.log('✓ decodeHtmlEntities passed');

// 2. parseForumTopics test (including topic 435 exclusion)
const sampleHtml = `
<ul class="topiclist topics">
  <li class="row bg1 announce">
    <a href="./viewtopic.php?t=435&amp;sid=abc" class="topictitle">VHS Tape Games Releases Index [A - Z]</a>
  </li>
  <li class="row bg2">
    <a href="./viewtopic.php?t=83&amp;sid=abc" class="topictitle">(The Lingering) Graveyard Visit v.2015 Repack</a>
  </li>
  <li class="row bg1">
    <a href="./viewtopic.php?t=165&amp;sid=abc" class="topictitle">[Chilla&#39;s Art] Inunaki Tunnel &amp; Dog</a>
  </li>
  <li class="row bg2">
    <a href="./viewtopic.php?t=238&amp;sid=abc" class="topictitle">A Dance of Fire and Ice v2.9.8 MULTi15-Repack</a>
  </li>
</ul>
`;

const parsedTopics = parseForumTopics(sampleHtml);
assert.strictEqual(parsedTopics.length, 3, 'Should have parsed exactly 3 topics (excluding announcement #435)');
assert.strictEqual(parsedTopics[0].id, '83', 'First topic id mismatch');
assert.strictEqual(parsedTopics[0].title, '(The Lingering) Graveyard Visit v.2015 Repack');
assert.strictEqual(parsedTopics[1].id, '165', 'Second topic id mismatch');
assert.strictEqual(parsedTopics[1].title, "[Chilla's Art] Inunaki Tunnel & Dog");
assert.strictEqual(parsedTopics[2].id, '238', 'Third topic id mismatch');
assert.strictEqual(parsedTopics[2].title, 'A Dance of Fire and Ice v2.9.8 MULTi15-Repack');
console.log('✓ parseForumTopics and announcement exclusion passed');

// 3. parseForumPagination test
const paginationHtml = '<div class="pagination">771 topics <ul><input data-per-page="25" /></ul></div>';
const pagination = parseForumPagination(paginationHtml);
assert.strictEqual(pagination.totalTopics, 771, 'Total topics count mismatch');
assert.strictEqual(pagination.perPage, 25, 'Per page mismatch');
assert.strictEqual(pagination.totalPages, 31, 'Total pages mismatch');
console.log('✓ parseForumPagination passed');

// 4. groupAndFormatTopics grouping and exact BBCode structure test
const mockTopics = [
  { id: '83', title: '(The Lingering) Graveyard Visit v.2015 Repack' },
  { id: '78', title: '(The Lingering) Last Customer v.1619 MULTi2-Repack' },
  { id: '234', title: '.hack//G.U. Last Recode v1.1.01 MULTi5-Repack' },
  { id: '235', title: '007 First Light v1.0 MULTi14-Repack' },
  { id: '165', title: "[Chilla's Art] Inunaki Tunnel" },
  { id: '238', title: 'A Dance of Fire and Ice v2.9.8 MULTi15-Repack' },
  { id: '515', title: 'Ace Attorney Investigations Collection Build 20413232 MULTi7-Repack' },
  { id: '248', title: 'Baba Is You v481d MULTi18-Repack' },
];

const result = groupAndFormatTopics(mockTopics, { includeHeader: false });
assert.deepStrictEqual(result.sectionKeys, ['#', 'A', 'B'], 'Section keys should be [# , A , B]');
assert.strictEqual(result.groups['#'].length, 5, '# group should contain 5 items');
assert.strictEqual(result.groups['A'].length, 2, 'A group should contain 2 items');
assert.strictEqual(result.groups['B'].length, 1, 'B group should contain 1 item');

// Verify BBCode formatting matches requirement_update.txt exactly
const expectedBbcode = [
  '[b][size=150][ # ][/size][/b]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=83](The Lingering) Graveyard Visit v.2015 Repack[/url]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=78](The Lingering) Last Customer v.1619 MULTi2-Repack[/url]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=234].hack//G.U. Last Recode v1.1.01 MULTi5-Repack[/url]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=235]007 First Light v1.0 MULTi14-Repack[/url]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=165][Chilla\'s Art] Inunaki Tunnel[/url]',
  '',
  '[b][size=150][ A ][/size][/b]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=238]A Dance of Fire and Ice v2.9.8 MULTi15-Repack[/url]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=515]Ace Attorney Investigations Collection Build 20413232 MULTi7-Repack[/url]',
  '',
  '[b][size=150][ B ][/size][/b]',
  '[url=https://vhstaperepacks.com/viewtopic.php?t=248]Baba Is You v481d MULTi18-Repack[/url]'
].join('\r\n');

assert.strictEqual(result.bbcode, expectedBbcode, 'BBCode output does not match expected format');
console.log('✓ groupAndFormatTopics exact BBCode match passed');

// 5. Header test
const resultWithHeader = groupAndFormatTopics(mockTopics, { includeHeader: true });
assert.ok(resultWithHeader.bbcode.startsWith('[size=200]VHS TAPE Releases A-Z[/size]'), 'Header missing from BBCode');
console.log('✓ Header banner option passed');

console.log('All Releases Index verification checks passed successfully!');
