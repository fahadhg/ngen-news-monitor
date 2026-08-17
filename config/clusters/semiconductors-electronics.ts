import type { NewsCluster } from "../../lib/types";

export const semiconductorsElectronics: NewsCluster = {
  id: "semiconductors-electronics",
  name: "Semiconductors & Advanced Electronics Manufacturing",
  description:
    "Semiconductor and advanced electronics manufacturing: chip fabrication and packaging, semiconductor fabs and equipment, wafer manufacturing, electronics manufacturing services (EMS) and PCB production, semiconductor supply chains, chip-plant investment, and Canadian/North American semiconductor industrial policy. Does not include consumer electronics product reviews or launch-event coverage with no manufacturing or supply-chain angle.",
  coreTerms: [
    "semiconductor manufacturing",
    "chip fabrication",
    "semiconductor fab",
    "chip packaging",
    "advanced electronics manufacturing",
    "semiconductor supply chain",
    "chip plant investment",
    "semiconductor equipment",
    "wafer fabrication",
    "electronics manufacturing services",
  ],
  secondaryTerms: [
    "semiconductor Canada",
    "CHIPS Act",
    "semiconductor materials",
    "PCB manufacturing",
    "microelectronics manufacturing",
    "POET Technologies",
  ],
  exclusionTerms: [
    "smartphone review",
    "laptop review",
    "gaming console review",
    "consumer electronics launch event",
  ],
  preferredCountries: ["ca", "us"],
  relevanceThreshold: 7,
  flaggedTerms: [
    {
      term: "chip shortage",
      reason:
        "Was a defining 2021-2023 story; by mid-2026 it may mostly surface recurring/low-relevance retrospective coverage rather than current manufacturing news. Kept as secondary — flag if you'd rather drop it.",
    },
    {
      term: "CHIPS Act",
      reason:
        "US-specific policy term. Strong signal for supply-chain/investment stories but will skew results toward US policy news over Canadian semiconductor manufacturing. Kept as secondary since it's still a reliable anchor for real fab-investment coverage.",
    },
    {
      term: "POET Technologies",
      reason:
        "This vertical was surfacing zero genuinely-Canadian (canada_tier 1/2) stories, and POET (Toronto-based semiconductor photonics) is the main real anchor available — but ~114 of ~114 recent mentions checked live were stock-ticker/earnings-analysis spam ('Trading Up 8% – Here's Why', 'Time to Buy?'), and Perigon's excludeLabel:Non-news filter didn't catch most of them (empty labels array). Added anyway, deliberately accepting the noisier candidate pool, on the reasoning that the relevance-scoring pass against this cluster's description should reject stock-analysis content even where the label filter doesn't. Revisit if Haiku's threshold-7 filter isn't actually rejecting these — check the ratio of POET stock-spam vs real POET manufacturing stories in stored output after a few days.",
    },
  ],
};
