import type { NewsCluster } from "./types";

function quote(term: string): string {
  return term.includes(" ") ? `"${term}"` : term;
}

/**
 * Compiles a cluster into Perigon's `q` boolean syntax: core + secondary terms
 * OR'd together (secondary terms aren't down-weighted at the query level —
 * Perigon's q param has no term-weighting syntax, so precision is enforced
 * downstream by the LLM relevance pass instead), exclusion terms NOT'd out.
 *
 * Geographic bias is intentionally NOT compiled into a hard `country` filter —
 * see NewsCluster.preferredCountries in lib/types.ts.
 */
export function buildPerigonQuery(cluster: NewsCluster): string {
  const included = [...cluster.coreTerms, ...cluster.secondaryTerms]
    .map(quote)
    .join(" OR ");

  if (cluster.exclusionTerms.length === 0) {
    return `(${included})`;
  }

  const excluded = cluster.exclusionTerms.map(quote).join(" OR ");
  return `(${included}) NOT (${excluded})`;
}
