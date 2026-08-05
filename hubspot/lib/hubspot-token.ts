import fs from "fs";

/**
 * Sandbox/production HubSpot private app tokens. Prefers an env var
 * (Railway, GitHub Actions — anywhere without access to this machine's
 * dotfiles) and falls back to the local dotfile convention documented in
 * ngen-trade-intel's PRODUCTION-CUTOVER.md (~/.hubspot_sandbox_private_app_token
 * / ~/.hubspot_production_private_app_token) for local dev convenience.
 * Never hardcode a token in a script.
 */
export function getSandboxToken(): string {
  if (process.env.HUBSPOT_SANDBOX_TOKEN) return process.env.HUBSPOT_SANDBOX_TOKEN;
  return fs.readFileSync(process.env.HOME + "/.hubspot_sandbox_private_app_token", "utf-8").trim();
}

export function getProductionToken(): string {
  if (process.env.HUBSPOT_PRODUCTION_TOKEN) return process.env.HUBSPOT_PRODUCTION_TOKEN;
  return fs.readFileSync(process.env.HOME + "/.hubspot_production_private_app_token", "utf-8").trim();
}
