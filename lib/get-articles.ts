import { getSupabaseClient } from "./supabase";
import type { NewsArticleRow } from "./types";

export async function getArticles(options: {
  vertical?: string | null;
  limit?: number;
}): Promise<NewsArticleRow[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("news_articles")
    .select("id, vertical, title, url, source, published_at, summary, relevance_score, sentiment, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(options.limit ?? 60);

  if (options.vertical) {
    query = query.eq("vertical", options.vertical);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  return data as NewsArticleRow[];
}
