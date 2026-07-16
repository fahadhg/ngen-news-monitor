import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewsCluster, PerigonArticle } from "./types";
import { computeCanadaTier } from "./relevance-tier";

export interface ScoredArticle {
  article: PerigonArticle;
  /** Claude Haiku's relevance score (1-10) — pass through selectWinners() first. */
  relevanceScore: number | null;
}

/**
 * Upserts already-scored, already-deduped articles into news_articles.
 * Callers are expected to have run these through enrichArticles() +
 * selectWinners() first — this function trusts relevanceScore as final.
 */
export async function storeArticles(
  supabase: SupabaseClient,
  cluster: NewsCluster,
  scored: ScoredArticle[]
): Promise<{ stored: number; error?: string }> {
  if (scored.length === 0) {
    return { stored: 0 };
  }

  const rows = scored.map(({ article, relevanceScore }) => ({
    vertical: cluster.id,
    title: article.title,
    url: article.url,
    source: article.source?.domain ?? null,
    published_at: article.pubDate ?? null,
    summary: article.summary ?? article.description ?? null,
    image_url: article.imageUrl ?? null,
    canada_tier: computeCanadaTier(article),
    relevance_score: relevanceScore,
    sentiment: article.sentiment ?? null,
    raw_perigon_json: article,
  }));

  const { error } = await supabase
    .from("news_articles")
    .upsert(rows, { onConflict: "url,vertical", ignoreDuplicates: false });

  if (error) {
    return { stored: 0, error: error.message };
  }

  return { stored: rows.length };
}
