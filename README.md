# NGen Manufacturing News Monitor (POC)

Daily news monitoring across 5 manufacturing verticals, scored/summarized via
Claude Haiku, stored in Supabase, served as a JSON feed for a HubSpot
"Newsroom" module. Built on Perigon's free tier (150 requests/month) — one
pull per vertical per day, no slack.

## Status

- [x] Folder structure
- [x] 5 cluster configs (draft — see "Needs your review" below)
- [x] Perigon fetch function + query builder, live for **Additive
      Manufacturing** and **Robotics & Automation**
- [x] Supabase schema migration (`news_articles` + `perigon_request_log`)
- [x] Storage — fetched articles are upserted into `news_articles` (dedup by
      `url unique`); near-duplicate-title dedup isn't written
- [x] Next.js UI (`app/page.tsx`) + JSON API route (`app/api/articles`)
- [x] Railway deploy config + HubSpot iframe embedding (CSP frame-ancestors)
- [ ] Claude Haiku relevance/summary enrichment — not built yet. Every row in
      `news_articles` has `relevance_score: null` right now — nothing has
      been filtered for quality, the UI shows a "preview build" banner
      because of this.
- [ ] Fetch functions for the other 3 verticals (Advanced Materials, Defence
      Manufacturing, Semiconductors & Electronics)
- [ ] GitHub Actions cron

## Folder structure

```
config/clusters/        One file per vertical, typed against lib/types.ts.
                         Tune terms here without touching pipeline code.
lib/
  types.ts               NewsCluster, Perigon response shapes, NewsArticleRow.
  query-builder.ts        Cluster -> Perigon `q` boolean string.
  perigon.ts              fetchArticlesForCluster() — the actual API call,
                           budget-gated, logged, filters out market-research-
                           report spam via excludeLabel (see "Findings" below).
  request-log.ts          Budget guardrail: checks + logs against
                           perigon_request_log before every call.
  store-articles.ts       Upserts fetched articles into news_articles.
  get-articles.ts          Reads news_articles for the UI / API route.
  supabase.ts              Server-side Supabase client (service role key —
                           never exposed to the browser; all queries run in
                           Server Components / Route Handlers).
scripts/
  fetch-additive-manufacturing.ts   One runner per live vertical. Fetches,
  fetch-robotics-automation.ts      logs, and stores.
app/
  page.tsx                Newsroom feed UI — server-rendered, filterable by
                           vertical via ?vertical= query param.
  api/articles/route.ts   Public JSON feed (for a HubSpot custom module).
  api/health/route.ts     Railway healthcheck target.
components/                NewsHeader, VerticalTabs, ArticleCard, SentimentBadge.
supabase/migrations/
  0001_news_articles.sql   news_articles + perigon_request_log tables.
```

## Setup

```bash
npm install
cp .env.example .env.local   # fill in PERIGON_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

Run the migration against your Supabase project (SQL editor, or the
Supabase CLI if you're using it elsewhere), then:

```bash
npm run fetch:additive
```

This prints the compiled query, then the raw Perigon response for the last
~26 hours, and logs the request to `perigon_request_log` either way (success
or failure) so the budget counter stays accurate.

## Things to verify on the first live run

Perigon's docs site wouldn't render for automated fetching while this was
drafted, so `lib/perigon.ts` and `lib/types.ts` (`PerigonArticle`) are built
from prior knowledge of the API rather than a freshly-pulled reference page.
Before trusting the output:

- Confirm the `q` boolean syntax (`AND`/`OR`/`NOT`, quoted phrases,
  parentheses) is actually being parsed as intended — check
  `numResults` against a couple of terms removed/added manually.
- Confirm param names (`from`, `to`, `sortBy`, `size`, `language`) match what
  your API key's response actually respects.
- Confirm article field names, especially `sentiment` and whether the field
  is `description` vs `summary` — adjust `PerigonArticle` in `lib/types.ts`
  to match what you actually get back.

## Needs your review (flagged terms)

Each cluster config has a `flaggedTerms` array with terms I wasn't fully
confident about — reasons inline. Summary:

- **Additive Manufacturing** — considered "digital manufacturing" as a
  secondary term, left out as too broad.
- **Robotics & Automation** — "smart factory" kept as secondary but
  buzzwordy; "robotic process automation" deliberately excluded (software
  bots, not physical robotics).
- **Advanced Materials** — "critical materials" kept as secondary but
  overlaps with mining/trade-policy noise; couldn't make "academic research
  only" work as a keyword exclusion, punted to the LLM relevance pass.
- **Defence Manufacturing** — conflict-news terms (battlefield, ceasefire,
  troop deployment) deliberately *not* excluded, since real supply-chain
  stories share that vocabulary — relying on the relevance pass instead.
- **Semiconductors & Electronics** — "chip shortage" may be a dated signal
  by now; "CHIPS Act" is US-policy-specific and will skew results.

None of the geographic bias (`preferredCountries`) is applied as a hard
Perigon filter — it's carried on the cluster object for later use in
relevance scoring / display ranking, per the "don't hard-exclude global
coverage" constraint.

## Budget guardrail

Every call to `fetchArticlesForCluster()` checks `perigon_request_log` for
the current calendar month and throws before making the request if the
count is already at 150. Failed requests are logged too, so a bad call still
counts against the budget the same way a real one would (matches how
Perigon's own metering works).

## Findings from live runs

- **Market-research-report spam**: on the first live Robotics pull, the top 2
  of 5 results by score were keyword-stuffed market-forecast mills
  (`openpr.com`, `indexbox.io`) — not real news, just SEO content ranking
  artificially high because it mentions every query term. Perigon tags these
  itself with `labels: [{"name": "Roundup"}]` (and generic listicle/blog
  content as `"Non-news"`), so `lib/perigon.ts` now sends
  `excludeLabel=Roundup,Non-news` on every request. This roughly halved raw
  result counts and applies to all verticals, not just Robotics.
- **Additive Manufacturing false positive**: a local crime story about
  3D-printed gun modification parts matched on "3D printed parts." Added
  firearm/crime exclusion terms — see `flaggedTerms` in that cluster config
  for the caveat (untested against a large sample; could over-exclude
  legitimate defence-adjacent AM coverage).

## UI

`app/page.tsx` is a server-rendered feed: NGen-branded header, vertical
filter tabs (`All` + each cluster), article cards (title linking out to the
source, source domain + date, Perigon's own summary, a sentiment badge when
one sentiment is clearly dominant). Design tokens (NGen copper/indigo/ocean
palette, Inter, card shadows) are copied from `ngen-trade-intel`'s
`tailwind.config.ts`/`globals.css` so it matches your other tools rather than
introducing a new look.

Run locally:

```bash
npm run dev
```

## Deploying to Railway

No Dockerfile needed — Railway's Nixpacks builder auto-detects Next.js.
`railway.json` pins the build/start commands explicitly (the repo also has
non-Next `scripts/`, so this avoids any ambiguity) and points the healthcheck
at `/api/health`.

1. Push this repo to GitHub, connect it in Railway (new project → Deploy from
   GitHub repo).
2. In Railway's project settings, add the env vars from `.env.local`:
   `PERIGON_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. (Skip
   `ANTHROPIC_API_KEY` until the enrichment step exists.)
3. Railway sets `PORT` automatically — `next start` already respects it, no
   extra config needed.
4. Optionally set `ALLOWED_ORIGIN` (defaults to `*`, since this feed is meant
   to be public) and `FRAME_ANCESTORS_ORIGINS` (defaults to
   `*.ngen.ca, *.railway.app, *.hubspot.com, *.hs-sites.com,
   *.hubspotpagebuilder.com, *.hubspotpreview.com` — covers HubSpot's editor,
   preview, and published-page domains) if you need a different allow-list.

## Embedding in HubSpot

Two options, both already supported:

**Iframe the page directly** — simplest. `next.config.ts` sends a
`Content-Security-Policy: frame-ancestors` header (not `X-Frame-Options`,
which doesn't support multi-origin allow-lists) permitting embedding from the
HubSpot domains above. Drop an iframe module pointed at your Railway URL onto
the HubSpot page.

**Build a custom HubSpot module** — fetch `GET /api/articles` (optionally
`?vertical=<id>&limit=<n>`) and render it with HubSpot's own theme/components
instead of an iframe. CORS is open (`Access-Control-Allow-Origin: *` by
default) since this feed isn't member-gated. Response shape:
`{ "articles": [{ id, vertical, title, url, source, published_at, summary,
relevance_score, sentiment, created_at }] }`. Note `relevance_score` is
`null` on every row until the Haiku enrichment pass exists — don't build
UI that assumes it's populated yet.

Unlike `ngen-trade-intel` (which is being moved behind JWT + HubSpot member
gating per its own integration plan), this feed is intentionally public, so
no auth/middleware layer is needed here.
