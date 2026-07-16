import type { PerigonArticle } from "./types";
import { mentionsCanada } from "./geo-terms";

/**
 * 1 = Canada is central to the story (headline/description mentions it) —
 *     shown first.
 * 2 = Canada is mentioned somewhere in the article body but not the
 *     headline — a supply-chain/trade-partner aside, not the main subject.
 * 3 = No Canada mention at all — the story matched on an allied country
 *     (US/NATO/Germany/etc.) that's relevant to Canadian manufacturing by
 *     extension, per query-builder.ts's GEO_CLAUSE.
 *
 * This is a keyword heuristic, not real relevance judgment — it exists to
 * sort what's already fetched sensibly until the Claude Haiku relevance
 * pass replaces it with actual understanding.
 */
export function computeCanadaTier(article: PerigonArticle): 1 | 2 | 3 {
  const headline = `${article.title} ${article.description ?? ""}`;
  if (mentionsCanada(headline)) return 1;

  const fullText = `${headline} ${article.content ?? ""} ${article.summary ?? ""}`;
  if (mentionsCanada(fullText)) return 2;

  return 3;
}
