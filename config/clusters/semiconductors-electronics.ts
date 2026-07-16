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
  ],
};
