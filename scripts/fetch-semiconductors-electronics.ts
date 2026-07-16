import { semiconductorsElectronics } from "../config/clusters/semiconductors-electronics";
import { buildPerigonQuery } from "../lib/query-builder";
import { fetchArticlesForCluster } from "../lib/perigon";
import { storeArticles } from "../lib/store-articles";
import { getSupabaseClient } from "../lib/supabase";

async function main() {
  console.log("Compiled query:");
  console.log(buildPerigonQuery(semiconductorsElectronics));
  console.log();

  const supabase = getSupabaseClient();
  const result = await fetchArticlesForCluster(semiconductorsElectronics, supabase);

  console.log(`numResults: ${result.numResults}`);
  console.log(`articles returned: ${result.articles?.length ?? 0}`);

  const { stored, error } = await storeArticles(supabase, semiconductorsElectronics, result.articles ?? []);
  if (error) {
    console.error(`Failed to store articles: ${error}`);
  } else {
    console.log(`stored/upserted into news_articles: ${stored}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
