import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { NewsCluster, PerigonArticle } from "./types";

const ScoredArticleSchema = z.object({
  id: z.string(),
  relevance: z.number().int().min(1).max(10),
  duplicate_group: z
    .string()
    .nullable()
    .describe(
      "Short label shared by every article covering the same real-world event (e.g. one government announcement reported by several outlets). Null if this article doesn't share an event with anything else in the batch."
    ),
});

const ScoringResponseSchema = z.object({
  articles: z.array(ScoredArticleSchema),
});

export interface EnrichedArticle {
  article: PerigonArticle;
  relevance: number;
  duplicateGroup: string | null;
}

/**
 * One batched Haiku call per vertical (not one call per article) — cheaper
 * and lets the model see the whole set at once, which is what makes
 * cross-outlet same-event grouping possible in the first place.
 */
export async function enrichArticles(
  cluster: NewsCluster,
  articles: PerigonArticle[]
): Promise<EnrichedArticle[]> {
  if (articles.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const client = new Anthropic({ apiKey });

  const items = articles.map((a, i) => ({
    id: String(i),
    title: a.title,
    description: a.description ?? a.summary ?? "",
    source: a.source?.domain ?? "",
  }));

  const response = await client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: `You score news articles for relevance to a manufacturing-news vertical and flag near-duplicate coverage of the same real-world event.

Vertical: ${cluster.name}
What belongs here: ${cluster.description}

For each article, score its relevance 1-10 against that description. 10 means squarely on-topic and substantive; 1 means unrelated or pure noise (e.g. unrelated geopolitics, local crime, celebrity news, a story that only mentions the vertical's topic in passing).

Also identify near-duplicates: multiple articles from DIFFERENT outlets covering the SAME real-world event (e.g. three different papers independently reporting the same government contract announcement) are a duplicate group, even though their URLs, authors, and exact wording differ. Give every article in such a group the same short duplicate_group label. Articles that don't share an event with anything else in this batch get duplicate_group: null.`,
    messages: [
      {
        role: "user",
        content: `Score and group these ${items.length} articles:\n\n${JSON.stringify(items, null, 2)}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(ScoringResponseSchema),
    },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Claude did not return parseable scoring output.");
  }

  const byId = new Map(parsed.articles.map((a) => [a.id, a]));

  const enriched: EnrichedArticle[] = [];
  articles.forEach((article, i) => {
    const scored = byId.get(String(i));
    if (scored) {
      enriched.push({ article, relevance: scored.relevance, duplicateGroup: scored.duplicate_group });
    }
  });

  return enriched;
}
