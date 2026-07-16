import type { NewsCluster } from "./types";

function quote(term: string): string {
  return term.includes(" ") ? `"${term}"` : term;
}

// Restricts every vertical to Canada-relevant coverage, per explicit request.
// Deliberately a content clause (AND'd into the query), not Perigon's
// `country` param — that param tags the *publishing outlet's* country, which
// live-tested at ~2 results for Additive Manufacturing (mostly wire-service
// mirrors, not real coverage) and would silently drop US/global trade press
// reporting on Canadian manufacturers, which is most of the good coverage.
// Province names are imprecise on their own (e.g. "Ontario, California"),
// but they're AND'd against the vertical's own manufacturing terms, and the
// still-unbuilt LLM relevance pass is the backstop for what slips through.
const CANADA_CLAUSE =
  '(Canada OR Canadian OR Ontario OR Quebec OR "British Columbia" OR Alberta OR Manitoba OR Saskatchewan OR "Nova Scotia" OR "New Brunswick" OR Toronto OR Montreal OR Vancouver OR Ottawa OR Calgary OR Winnipeg OR Edmonton OR NGen)';

/**
 * Compiles a cluster into Perigon's `q` boolean syntax: core + secondary terms
 * OR'd together (secondary terms aren't down-weighted at the query level —
 * Perigon's q param has no term-weighting syntax, so precision is enforced
 * downstream by the LLM relevance pass instead), AND'd against the Canada
 * content clause above, exclusion terms NOT'd out.
 */
export function buildPerigonQuery(cluster: NewsCluster): string {
  const included = [...cluster.coreTerms, ...cluster.secondaryTerms]
    .map(quote)
    .join(" OR ");

  const base = `(${included}) AND ${CANADA_CLAUSE}`;

  if (cluster.exclusionTerms.length === 0) {
    return base;
  }

  const excluded = cluster.exclusionTerms.map(quote).join(" OR ");
  return `${base} NOT (${excluded})`;
}
