import type { EnrichedArticle } from "./enrich-articles";
import { computeCanadaTier } from "./relevance-tier";
import type { ScoredArticle } from "./store-articles";

/**
 * Applies the vertical's relevance threshold, then collapses each
 * duplicate_group down to a single winner — highest relevance first,
 * then most Canada-primary (tier 1 beats 2 beats 3), then most recent.
 */
export function selectWinners(enriched: EnrichedArticle[], threshold: number): ScoredArticle[] {
  const aboveThreshold = enriched.filter((e) => e.relevance >= threshold);

  const groups = new Map<string, EnrichedArticle[]>();
  const singles: EnrichedArticle[] = [];
  for (const e of aboveThreshold) {
    if (e.duplicateGroup) {
      const list = groups.get(e.duplicateGroup) ?? [];
      list.push(e);
      groups.set(e.duplicateGroup, list);
    } else {
      singles.push(e);
    }
  }

  const winners: EnrichedArticle[] = [...singles];
  for (const group of groups.values()) {
    winners.push(pickBest(group));
  }

  return winners.map((e) => ({ article: e.article, relevanceScore: e.relevance }));
}

function pickBest(group: EnrichedArticle[]): EnrichedArticle {
  return group.reduce((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance > a.relevance ? b : a;

    const tierA = computeCanadaTier(a.article);
    const tierB = computeCanadaTier(b.article);
    if (tierA !== tierB) return tierB < tierA ? b : a;

    return new Date(b.article.pubDate).getTime() > new Date(a.article.pubDate).getTime() ? b : a;
  });
}
