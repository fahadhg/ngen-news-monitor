import { semiconductorsElectronics } from "../config/clusters/semiconductors-electronics";
import { runFetchForCluster } from "../lib/run-fetch";

runFetchForCluster(semiconductorsElectronics).catch((err) => {
  console.error(err);
  process.exit(1);
});
