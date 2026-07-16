export interface NewsCluster {
  /** Slug used as the `vertical` value in Supabase and in filenames. */
  id: string;
  name: string;
  /**
   * One-paragraph description of what belongs in this vertical.
   * Fed directly into the Claude Haiku relevance-scoring prompt later —
   * write it as "an article belongs here if it's about X, Y, Z" prose.
   */
  description: string;
  /** Primary anchor terms — companies, technologies, taxonomy topics. */
  coreTerms: string[];
  /** Adjacent terms that catch coverage the core terms miss. OR'd in alongside core terms. */
  secondaryTerms: string[];
  /** Terms that pull in known false positives; NOT'd out of the query. */
  exclusionTerms: string[];
  /**
   * Soft geographic bias only — NOT passed to Perigon as a hard `country` filter,
   * since that would exclude global coverage of major manufacturing news.
   * Reserved for later use in relevance scoring / display ranking.
   */
  preferredCountries?: string[];
  /** Minimum LLM relevance score (1-10) for an article to be stored. */
  relevanceThreshold: number;
  /** Terms drafted with low confidence — confirm before locking the cluster in. */
  flaggedTerms?: { term: string; reason: string }[];
}

export interface PerigonArticle {
  articleId: string;
  url: string;
  title: string;
  description: string | null;
  summary?: string | null;
  content?: string | null;
  source: {
    domain: string;
    location?: { country?: string; state?: string; city?: string } | null;
  };
  pubDate: string;
  addDate?: string;
  language?: string;
  country?: string;
  sentiment?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topics?: { name: string }[];
  categories?: { name: string }[];
  labels?: { name: string }[];
  /** Perigon's own relevance score for this query — raw scale (seen ~100-150), not 1-10. */
  score?: number;
}

export interface PerigonSearchResponse {
  status: number;
  numResults: number;
  articles: PerigonArticle[];
}

/** A row from the news_articles table (see supabase/migrations/0001_news_articles.sql). */
export interface NewsArticleRow {
  id: string;
  vertical: string;
  title: string;
  url: string;
  source: string | null;
  published_at: string | null;
  summary: string | null;
  relevance_score: number | null;
  sentiment: { positive: number; negative: number; neutral: number } | null;
  created_at: string;
}
