import type { NewsCluster } from "./types";
import { buildPerigonQuery } from "./query-builder";
import { fetchArticlesForCluster } from "./perigon";
import { enrichArticles } from "./enrich-articles";
import { selectWinners } from "./select-winners";
import { storeArticles } from "./store-articles";
import { getSupabaseClient } from "./supabase";

export async function runFetchForCluster(cluster: NewsCluster): Promise<void> {
  console.log("Compiled query:");
  console.log(buildPerigonQuery(cluster));
  console.log();

  const supabase = getSupabaseClient();
  const result = await fetchArticlesForCluster(cluster, supabase);

  console.log(`numResults: ${result.numResults}`);
  console.log(`articles returned: ${result.articles?.length ?? 0}`);

  const enriched = await enrichArticles(cluster, result.articles ?? []);
  console.log(`scored by Claude: ${enriched.length}`);

  const winners = selectWinners(enriched, cluster.relevanceThreshold);
  console.log(`above threshold (>=${cluster.relevanceThreshold}) after dedup: ${winners.length}`);

  const { stored, error } = await storeArticles(supabase, cluster, winners);
  if (error) {
    console.error(`Failed to store articles: ${error}`);
  } else {
    console.log(`stored/upserted into news_articles: ${stored}`);
  }
}
