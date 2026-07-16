import type { NewsCluster } from "../../lib/types";

export const advancedMaterials: NewsCluster = {
  id: "advanced-materials",
  name: "Advanced Materials",
  description:
    "Next-generation industrial materials with a manufacturing or commercial-application angle: composites, advanced alloys, nanomaterials, smart/functional materials, battery materials, and materials-science developments being adopted by manufacturers. Does not include pure academic materials-science research with no near-term commercial application, or consumer product/cosmetic material marketing.",
  coreTerms: [
    "advanced materials manufacturing",
    "composite materials manufacturing",
    "carbon fiber composite",
    "advanced alloys",
    "nanomaterials manufacturing",
    "lightweight materials manufacturing",
    "battery materials",
    "smart materials",
    "high-performance materials",
  ],
  secondaryTerms: [
    "materials supply chain",
    "critical materials",
    "materials innovation manufacturing",
    "biomaterials manufacturing",
    "materials Canada",
    "rare earth materials",
  ],
  exclusionTerms: ["skincare", "cosmetics", "fashion fabric"],
  preferredCountries: ["ca", "us"],
  relevanceThreshold: 7,
  flaggedTerms: [
    {
      term: "critical materials",
      reason:
        "Overlaps heavily with mining and trade-policy coverage — may pull geopolitics-heavy articles (export controls, critical minerals strategy) with only a thin manufacturing angle. Kept as secondary; relevance scoring will need to do the real filtering here.",
    },
    {
      term: "academic study / laboratory research only (considered as exclusion)",
      reason:
        "Wanted to exclude pure-research coverage, but this isn't a keyword real articles use, so it won't work as a literal exclusion term. Left out — relying on the LLM relevance pass against the vertical description to catch 'lab-only, no commercial application' articles instead.",
    },
  ],
};
