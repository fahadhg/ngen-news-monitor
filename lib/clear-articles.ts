import type { SupabaseClient } from "@supabase/supabase-js";

export async function clearArticles(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("news_articles")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`Failed to clear news_articles: ${error.message}`);
  }
}
