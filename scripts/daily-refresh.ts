import { clusters } from "../config/clusters";
import { getSupabaseClient } from "../lib/supabase";
import { clearArticles } from "../lib/clear-articles";
import { runFetchForCluster } from "../lib/run-fetch";

// Wipes and refetches every vertical fresh each run, rather than accumulating
// forever — the feed always reflects fetchArticlesForCluster's rolling
// 72-hour lookback + current relevance scoring, with nothing going stale.
// One Perigon request per vertical per run (5/day) — matches the original
// 150/month budget design at exactly 30 days; a 31-day month runs a request
// over budget on the last day, which the guardrail in lib/request-log.ts
// blocks outright rather than silently exceeding the cap.
async function main() {
  const supabase = getSupabaseClient();

  console.log("Clearing previous articles...");
  await clearArticles(supabase);

  for (const cluster of clusters) {
    console.log(`\n=== ${cluster.name} ===`);
    try {
      await runFetchForCluster(cluster);
    } catch (err) {
      // Don't let one vertical's failure (budget exhausted, transient API
      // error, etc.) prevent the rest from attempting their own refresh.
      console.error(`Failed to refresh ${cluster.name}:`, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
