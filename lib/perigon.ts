import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewsCluster, PerigonSearchResponse } from "./types";
import { buildPerigonQuery } from "./query-builder";
import { assertBudgetAvailable, logRequest } from "./request-log";

const PERIGON_BASE_URL = "https://api.goperigon.com/v1/all";

/**
 * NOTE ON QUERY SYNTAX / RESPONSE SHAPE:
 * Perigon's public docs site would not render for automated fetching when this
 * was drafted, so the param names and response fields below are drawn from prior
 * knowledge of the API rather than a freshly-checked reference page. Treat this
 * as the thing to sanity-check on the first live call — in particular:
 *   - `q` boolean syntax (AND/OR/NOT, quoted phrases, parentheses) should be correct,
 *   - param names (from/to/sortBy/size/language) are the standard v1 names but worth
 *     confirming against your API key's actual response,
 *   - the exact article field names (esp. `sentiment`, `summary` vs `description`)
 *     may need adjusting once you see a real payload — lib/types.ts PerigonArticle
 *     is written to be easy to tweak.
 */

export interface FetchClusterOptions {
  /**
   * ISO datetime lower bound. Defaults to 72 hours ago — widened from an
   * original 26-hour window because Canada-tight niches (Additive
   * Manufacturing, Robotics) were returning single-digit results per day
   * once reprints were deduplicated; this is "recent" rather than strictly
   * "today" as a deliberate volume/freshness tradeoff.
   */
  from?: string;
  /** ISO datetime upper bound. Defaults to now. */
  to?: string;
  size?: number;
}

function defaultFromIso(): string {
  return new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
}

export async function fetchArticlesForCluster(
  cluster: NewsCluster,
  supabase: SupabaseClient,
  options: FetchClusterOptions = {}
): Promise<PerigonSearchResponse> {
  const apiKey = process.env.PERIGON_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PERIGON_API_KEY environment variable.");
  }

  await assertBudgetAvailable(supabase);

  const q = buildPerigonQuery(cluster);
  const params = {
    apiKey,
    q,
    from: options.from ?? defaultFromIso(),
    to: options.to ?? new Date().toISOString(),
    sortBy: "relevance",
    size: String(options.size ?? 100),
    language: "en",
    // Filters out market-research-report mills and non-journalism content —
    // both label values were observed on keyword-stuffed forecast spam that
    // otherwise ranks artificially high (see README "Findings from live runs").
    excludeLabel: "Roundup,Non-news",
    // Collapses wire-service syndication (one CP/Postmedia story running
    // near-identically on a dozen regional-paper domains) down to one
    // canonical copy per reprintGroupId — otherwise a single story can fill
    // half a vertical's results with duplicates under different URLs, which
    // URL-based dedup alone doesn't catch.
    showReprints: "false",
  };

  const url = new URL(PERIGON_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // request_params logged without the API key.
  const loggableParams = { ...params, apiKey: undefined };

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    await logRequest(supabase, {
      vertical: cluster.id,
      requestParams: loggableParams,
      resultCount: null,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  if (!response.ok) {
    const body = await response.text();
    await logRequest(supabase, {
      vertical: cluster.id,
      requestParams: loggableParams,
      resultCount: null,
      status: "error",
      errorMessage: `HTTP ${response.status}: ${body}`,
    });
    throw new Error(`Perigon request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as PerigonSearchResponse;

  await logRequest(supabase, {
    vertical: cluster.id,
    requestParams: loggableParams,
    resultCount: data.numResults ?? data.articles?.length ?? 0,
    status: "ok",
  });

  return data;
}
