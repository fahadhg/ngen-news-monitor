import type { NextConfig } from "next";

// Same pattern as ngen-trade-intel: CSP frame-ancestors (not X-Frame-Options —
// ALLOWALL isn't a valid value and browsers treat it as DENY) is the only
// mechanism that supports a multi-origin allow-list, which we need since this
// gets embedded from a HubSpot-hosted page. Runtime-configurable via
// FRAME_ANCESTORS_ORIGINS so the allow-list doesn't require a redeploy.
const DEFAULT_FRAME_ANCESTORS_ORIGINS = [
  "https://*.ngen.ca",
  "https://*.railway.app",
  "https://*.hubspot.com",
  "https://*.hs-sites.com",
  "https://*.hubspotpagebuilder.com",
  "https://*.hubspotpreview.com",
];
const FRAME_ANCESTORS_ORIGINS = process.env.FRAME_ANCESTORS_ORIGINS
  ? process.env.FRAME_ANCESTORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : DEFAULT_FRAME_ANCESTORS_ORIGINS;
const FRAME_ANCESTORS = `frame-ancestors 'self' ${FRAME_ANCESTORS_ORIGINS.join(" ")}`;

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        // The whole app is the embeddable widget (unlike trade-intel, which
        // scopes this to one subpath) — allow it to be iframed from the
        // approved origins above.
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: FRAME_ANCESTORS }],
      },
      {
        // This feed is intentionally public (no member gating, unlike
        // trade-intel) — CORS is open so a HubSpot custom module can fetch it
        // directly instead of only via iframe.
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGIN ?? "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
