import { additiveManufacturing } from "../config/clusters/additive-manufacturing";
import { runFetchForCluster } from "../lib/run-fetch";

runFetchForCluster(additiveManufacturing).catch((err) => {
  console.error(err);
  process.exit(1);
});
