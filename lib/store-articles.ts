import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewsCluster, PerigonArticle } from "./types";

/**
 * Upserts raw Perigon results into news_articles for inspection.
 * relevance_score and summary are left as Perigon's own values for now —
 * there's no Claude Haiku relevance/summary pass yet, so nothing here has
 * been vetted against the vertical description. Treat every row as
 * unfiltered until that step exists.
 */
export async function storeArticles(
  supabase: SupabaseClient,
  cluster: NewsCluster,
  articles: PerigonArticle[]
): Promise<{ stored: number; error?: string }> {
  if (articles.length === 0) {
    return { stored: 0 };
  }

  const rows = articles.map((article) => ({
    vertical: cluster.id,
    title: article.title,
    url: article.url,
    source: article.source?.domain ?? null,
    published_at: article.pubDate ?? null,
    summary: article.summary ?? article.description ?? null,
    relevance_score: null,
    sentiment: article.sentiment ?? null,
    raw_perigon_json: article,
  }));

  const { error } = await supabase
    .from("news_articles")
    .upsert(rows, { onConflict: "url", ignoreDuplicates: false });

  if (error) {
    return { stored: 0, error: error.message };
  }

  return { stored: rows.length };
}
