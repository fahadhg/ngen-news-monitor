import { Client } from "@hubspot/api-client";
import { getSupabaseClient } from "../../lib/supabase";
import { getSandboxToken } from "./hubspot-token";
import tableIds from "../scripts/table-ids.json";

interface SupabaseArticle {
  vertical: string;
  title: string;
  url: string;
  source: string | null;
  published_at: string | null;
  summary: string | null;
  image_url: string | null;
  canada_tier: number | null;
}

async function fetchAllArticles(): Promise<SupabaseArticle[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("news_articles")
    .select("vertical, title, url, source, published_at, summary, image_url, canada_tier");
  if (error) throw new Error(`Failed to read Supabase news_articles: ${error.message}`);
  return data as SupabaseArticle[];
}

function toHubDbRow(article: SupabaseArticle) {
  return {
    path: article.url.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 200),
    name: article.title.slice(0, 200),
    values: {
      vertical: article.vertical,
      title: article.title,
      url: article.url,
      source: article.source ?? "",
      published_at: article.published_at ? new Date(article.published_at).getTime() : null,
      summary: article.summary ?? "",
      image_url: article.image_url ?? "",
      canada_tier: article.canada_tier ?? 3,
    },
  };
}

/**
 * Syncs today's Supabase winners (output of the existing Perigon -> Claude
 * Haiku -> Supabase pipeline, unchanged) into the sandbox news_articles
 * HubDB table. Clear + reinsert, same philosophy as clearArticles() in
 * lib/clear-articles.ts for Supabase itself.
 */
export async function syncSandboxHubDb(): Promise<void> {
  const tableId = tableIds.sandbox.news_articles;
  if (!tableId) throw new Error("hubspot/scripts/table-ids.json has no sandbox.news_articles id.");

  const sandbox = new Client({ accessToken: getSandboxToken() });

  const articles = await fetchAllArticles();
  console.log(`Supabase has ${articles.length} current articles`);

  const existingRows: string[] = [];
  let after: string | undefined;
  do {
    const res = await sandbox.cms.hubdb.rowsApi.getTableRows(tableId, undefined, after, 200);
    for (const row of res.results ?? []) {
      if (row.id) existingRows.push(row.id);
    }
    const next = res.paging?.next;
    after = next && "after" in next ? next.after : undefined;
  } while (after);

  if (existingRows.length > 0) {
    for (let i = 0; i < existingRows.length; i += 100) {
      await sandbox.cms.hubdb.rowsBatchApi.purgeDraftTableRows(tableId, { inputs: existingRows.slice(i, i + 100) });
    }
    console.log(`Cleared ${existingRows.length} existing sandbox HubDB rows`);
  }

  const inputs = articles.map(toHubDbRow);
  let inserted = 0;
  for (let i = 0; i < inputs.length; i += 100) {
    const batch = inputs.slice(i, i + 100);
    await sandbox.cms.hubdb.rowsBatchApi.createDraftTableRows(tableId, { inputs: batch });
    inserted += batch.length;
  }
  console.log(`Inserted ${inserted} rows`);

  await sandbox.cms.hubdb.tablesApi.publishDraftTable(tableId);
  console.log(`Published sandbox HubDB table ${tableId}`);
}
