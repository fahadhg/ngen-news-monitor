import { defenceManufacturing } from "../config/clusters/defence-manufacturing";
import { runFetchForCluster } from "../lib/run-fetch";

runFetchForCluster(defenceManufacturing).catch((err) => {
  console.error(err);
  process.exit(1);
});
