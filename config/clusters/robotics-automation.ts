import type { NewsCluster } from "../../lib/types";

export const roboticsAutomation: NewsCluster = {
  id: "robotics-automation",
  name: "Robotics & Industrial Automation",
  description:
    "Industrial robotics and factory automation: collaborative robots (cobots), robotic arms and welding/assembly cells, warehouse and logistics automation, autonomous mobile robots on factory floors, machine vision for production, and investment or adoption of automation by Canadian and North American manufacturers. Does not include consumer robotics, toy robots, robot vacuums, or robotics coverage in film/gaming/entertainment.",
  coreTerms: [
    "industrial robotics",
    "collaborative robot",
    "cobot",
    "factory automation",
    "robotic arm manufacturing",
    "warehouse automation",
    "automated production line",
    "robotics manufacturing investment",
    "autonomous mobile robot",
    "machine vision manufacturing",
  ],
  secondaryTerms: [
    "robotics workforce",
    "human-robot collaboration",
    "robotics supply chain",
    "robotics Canada",
    "smart factory",
  ],
  exclusionTerms: [
    "toy robot",
    "robot vacuum",
    "consumer robot",
    "video game",
    "movie robot",
  ],
  preferredCountries: ["ca", "us"],
  relevanceThreshold: 7,
  flaggedTerms: [
    {
      term: "smart factory",
      reason:
        "Broad/buzzwordy — often used loosely in generic Industry 4.0 marketing copy without a concrete robotics/automation story. Kept as secondary (lower weight in relevance scoring) rather than core.",
    },
    {
      term: "robotic process automation (deliberately excluded)",
      reason:
        "RPA almost always refers to software bots in finance/BPO/back-office contexts, not physical manufacturing robotics — left out entirely to avoid false positives, but flagging in case you track software-side automation too.",
    },
  ],
};
