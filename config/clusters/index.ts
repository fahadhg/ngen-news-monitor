import type { NewsCluster } from "../../lib/types";
import { additiveManufacturing } from "./additive-manufacturing";
import { roboticsAutomation } from "./robotics-automation";
import { advancedMaterials } from "./advanced-materials";
import { defenceManufacturing } from "./defence-manufacturing";
import { semiconductorsElectronics } from "./semiconductors-electronics";

export const clusters: NewsCluster[] = [
  additiveManufacturing,
  roboticsAutomation,
  advancedMaterials,
  defenceManufacturing,
  semiconductorsElectronics,
];

export const clustersById: Record<string, NewsCluster> = Object.fromEntries(
  clusters.map((cluster) => [cluster.id, cluster])
);
