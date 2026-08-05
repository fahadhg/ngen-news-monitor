// Thin CLI wrapper around hubspot/lib/sync-hubdb-sandbox.ts's syncSandboxHubDb().
// Standalone use: npm run hubdb:sync-sandbox
// Also imported directly by scripts/daily-refresh.ts as the pipeline's final step.
import { syncSandboxHubDb } from "../lib/sync-hubdb-sandbox";

syncSandboxHubDb().catch((err) => {
  console.error(err.body ? JSON.stringify(err.body, null, 2) : err);
  process.exit(1);
});
