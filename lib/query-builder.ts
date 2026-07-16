import type { NewsCluster } from "./types";
import { CANADA_TERMS, ALLIED_TERMS, orClause } from "./geo-terms";

function quote(term: string): string {
  return term.includes(" ") ? `"${term}"` : term;
}

// Canada terms OR allied-country terms — broader than Canada-only (per
// explicit request: "countries which would affect canadian manufacturing
// too"), but still geographically scoped rather than open to all global
// coverage. Canadian-ness within these results is ranked, not filtered —
// see lib/relevance-tier.ts for the 3-tier sort applied at read time.
const GEO_CLAUSE = orClause([...CANADA_TERMS, ...ALLIED_TERMS]);

/**
 * Compiles a cluster into Perigon's `q` boolean syntax: core + secondary terms
 * OR'd together (secondary terms aren't down-weighted at the query level —
 * Perigon's q param has no term-weighting syntax, so precision is enforced
 * downstream by the LLM relevance pass instead), AND'd against the geo
 * clause above, exclusion terms NOT'd out.
 */
export function buildPerigonQuery(cluster: NewsCluster): string {
  const included = [...cluster.coreTerms, ...cluster.secondaryTerms]
    .map(quote)
    .join(" OR ");

  const base = `(${included}) AND ${GEO_CLAUSE}`;

  if (cluster.exclusionTerms.length === 0) {
    return base;
  }

  const excluded = cluster.exclusionTerms.map(quote).join(" OR ");
  return `${base} NOT (${excluded})`;
}
