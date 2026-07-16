import type { NewsCluster } from "../../lib/types";

export const defenceManufacturing: NewsCluster = {
  id: "defence-manufacturing",
  name: "Defence Manufacturing",
  description:
    "Canadian and allied defence-sector manufacturing: military hardware production, shipbuilding contracts, munitions and combat systems manufacturing, defence supply chains, defence industrial-base investment, and defence procurement policy as it affects manufacturers. Does not include general war/conflict reporting, casualty or battlefield news, or geopolitical coverage with no manufacturing or industrial-base angle.",
  coreTerms: [
    "defence manufacturing",
    "defense manufacturing",
    "military hardware production",
    "shipbuilding contract",
    "defence supply chain",
    "munitions manufacturing",
    "defence industrial base",
    "aerospace defence contract",
    "defence procurement Canada",
  ],
  secondaryTerms: [
    "NATO industrial capacity",
    "defence innovation",
    "military equipment production",
    "defence contractor Canada",
    "dual-use manufacturing",
  ],
  exclusionTerms: ["video game", "toy soldier"],
  preferredCountries: ["ca", "us"],
  relevanceThreshold: 7,
  flaggedTerms: [
    {
      term: "battlefield / ceasefire / troop deployment (considered as exclusions)",
      reason:
        "Wanted to exclude general war-conflict news, but legitimate defence-manufacturing stories (e.g. 'artillery shell production surges amid war') routinely share vocabulary with conflict reporting. Excluding these terms risked losing real supply-chain articles, so they were left out — relying on the LLM relevance pass against the vertical description to separate 'manufacturing angle' from 'battlefield reporting'. Worth a second look once we see real query results.",
    },
  ],
};
