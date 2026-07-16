import { advancedMaterials } from "../config/clusters/advanced-materials";
import { runFetchForCluster } from "../lib/run-fetch";

runFetchForCluster(advancedMaterials).catch((err) => {
  console.error(err);
  process.exit(1);
});
