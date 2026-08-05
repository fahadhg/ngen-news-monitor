// One-time: creates the news_articles HubDB table in the sandbox portal.
// Run once; re-running is safe (checks for an existing table by name first).
//
// Column choice notes:
// - `vertical` is TEXT, not SELECT, matching the working precedent in
//   ngen-trade-intel's trade_gated_data table (dataset_key column, TEXT),
//   which is filtered the same way we plan to filter this one
//   (hubdb_table_rows(id, "vertical=X&...")) — avoids any SELECT-option
//   value-format friction in the query filter syntax.
// - `published_at` is DATETIME (HubDB stores these as epoch milliseconds,
//   not ISO strings — the sync script converts).
// - relevance_score and sentiment are deliberately NOT columns here — they
//   were never sent to the client on the Railway build either (see
//   lib/types.ts ArticleCardData in the Next.js app), so there's nothing to
//   carry over.
import { Client } from '@hubspot/api-client';
import fs from 'fs';

const sandboxToken = fs.readFileSync(process.env.HOME + '/.hubspot_sandbox_private_app_token', 'utf-8').trim();
const sandbox = new Client({ accessToken: sandboxToken });

const TABLE_NAME = 'news_articles';

const COLUMNS = [
  { name: 'vertical', label: 'Vertical', type: 'TEXT' },
  { name: 'title', label: 'Title', type: 'TEXT' },
  { name: 'url', label: 'URL', type: 'TEXT' },
  { name: 'source', label: 'Source', type: 'TEXT' },
  { name: 'published_at', label: 'Published At', type: 'DATETIME' },
  { name: 'summary', label: 'Summary', type: 'TEXT' },
  { name: 'image_url', label: 'Image URL', type: 'TEXT' },
  { name: 'canada_tier', label: 'Canada Tier', type: 'NUMBER' },
];

async function main() {
  const existing = await sandbox.cms.hubdb.tablesApi.getAllTables();
  const found = existing.results.find((t) => t.name === TABLE_NAME);
  if (found) {
    console.log(`Table already exists: ${TABLE_NAME} -> id ${found.id} (columns unchanged, not re-created)`);
    return;
  }

  const created = await sandbox.cms.hubdb.tablesApi.createTable({
    name: TABLE_NAME,
    label: 'News Articles',
    useForPages: false,
    columns: COLUMNS,
  });
  console.log(`Created table ${TABLE_NAME} -> id ${created.id}`);
  console.log('Save this id into hubspot/scripts/table-ids.json as { "news_articles": "' + created.id + '" }');
}

main().catch((err) => {
  console.error(err.body ? JSON.stringify(err.body, null, 2) : err);
  process.exit(1);
});
