import type { NewsCluster } from "../../lib/types";

export const additiveManufacturing: NewsCluster = {
  id: "additive-manufacturing",
  name: "Additive Manufacturing",
  description:
    "Industrial and production-grade additive manufacturing: metal AM (powder bed fusion, directed energy deposition, binder jetting), polymer AM used at production scale, AM materials and powders, AM service bureaus, and adoption or investment in AM by aerospace, defence, medical device, and automotive manufacturers. Does not include consumer or hobbyist desktop 3D printing, or entertainment/novelty uses of 3D printing.",
  coreTerms: [
    "additive manufacturing",
    "metal 3D printing",
    "powder bed fusion",
    "laser powder bed fusion",
    "binder jetting",
    "directed energy deposition",
    "industrial 3D printing",
    "metal AM",
    "3D printed parts",
    "AM service bureau",
  ],
  secondaryTerms: [
    "3D printing materials",
    "metal powder manufacturing",
    "3D printing aerospace",
    "3D printing medical device",
    "additive manufacturing investment",
    "3D printing supply chain",
  ],
  exclusionTerms: [
    "hobbyist 3D printer",
    "desktop 3D printer",
    "3D printing pen",
    "consumer 3D printer",
    "cosplay",
    "Etsy",
    "ghost gun",
    "3D printed gun",
    "machine gun conversion",
    "firearm modification",
    "law enforcement seized",
  ],
  preferredCountries: ["ca", "us"],
  relevanceThreshold: 7,
  flaggedTerms: [
    {
      term: "digital manufacturing (not included as core, considered)",
      reason:
        "Too broad/buzzwordy on its own — pulls in generic digital-twin and MES software stories with no AM angle. Left out of the term list; flagging in case you want it added as a secondary term anyway.",
    },
    {
      term: "ghost gun / 3D printed gun / machine gun conversion / firearm modification / law enforcement seized",
      reason:
        "Added after the first live pull surfaced a local crime story (3D-printed gun modification parts) that matched purely on the core term \"3D printed parts.\" Untested against a large sample — worth revisiting if it starts excluding legitimate defence/security-manufacturing coverage instead of crime-blotter stories.",
    },
  ],
};
