import { roboticsAutomation } from "../config/clusters/robotics-automation";
import { runFetchForCluster } from "../lib/run-fetch";

runFetchForCluster(roboticsAutomation).catch((err) => {
  console.error(err);
  process.exit(1);
});
