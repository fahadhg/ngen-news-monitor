# NGen Manufacturing News Monitor

Daily-refreshed feed of Canada-relevant manufacturing news across 5 verticals.
Perigon supplies raw articles, Claude Haiku scores relevance and collapses
cross-outlet duplicates of the same event, Supabase stores the winners, and
they're synced into a HubSpot HubDB table that a native HubSpot module reads
directly. Railway hosts the pipeline (as a cron worker) and a small Next.js
API — it does **not** serve the live page anymore; HubSpot does.

**Live:** `51764260.hs-sites.com/news` (sandbox portal) · Repo:
`github.com/fahadhg/ngen-news-monitor` (private)

## Status

- [x] All 5 verticals live: Additive Manufacturing, Robotics & Automation,
      Advanced Materials, Defence Manufacturing, Semiconductors & Electronics
- [x] Canada + allied-country geo scope (content clause, not a hard source-
      country filter — see "How the pipeline works")
- [x] Wire-syndication collapse (`showReprints=false`)
- [x] Claude Haiku relevance scoring (1–10, threshold 7) + cross-outlet
      same-event dedup, batched per vertical
- [x] Supabase storage, budget-guarded Perigon calls
- [x] Daily GitHub Actions refresh (`.github/workflows/daily-refresh.yml`),
      including the Supabase → HubDB sync step
- [x] Live on HubSpot: `hubspot/modules/news-feed.module` reads HubDB
      directly, sorted Canada-tier first then recency
- [ ] Legal sign-off on public display rights — see "Legal" below. **Don't
      treat this as cleared for embedding on ngen.ca yet.**
- [ ] Production HubDB table/promotion — currently sandbox-only
      (`hubspot/scripts/table-ids.json`'s `production` entries are still
      `null`)

## How the pipeline works

Each vertical runs through the same sequence (`lib/run-fetch.ts`):

1. **Fetch** — one Perigon search per vertical, last 72 hours, up to 100
   results ranked by Perigon's own relevance score (`lib/perigon.ts`).
2. **Geo scope** — the query itself requires a Canada or allied-country
   mention (US, NATO, Germany, UK) via `lib/query-builder.ts` +
   `lib/geo-terms.ts`. Deliberately a content clause, not Perigon's `country`
   param — that param tags the *publishing outlet's* country and live-tested
   at ~2 near-useless results (mostly wire mirrors), which would also drop
   US/global trade press covering Canadian manufacturers.
3. **Wire-syndication collapse** — `showReprints=false` collapses one CP/
   Postmedia story running near-identically across a dozen regional-paper
   domains down to one canonical copy.
4. **Relevance scoring + same-event dedup** — `lib/enrich-articles.ts` batches
   the vertical's surviving articles into a single Claude Haiku call, scoring
   each 1–10 against the vertical's own description and flagging when
   *different* outlets independently cover the same real-world event (e.g. 5
   papers on one government contract announcement). `lib/select-winners.ts`
   drops anything below the vertical's `relevanceThreshold` (7) and keeps only
   the best-scored article per event group.
5. **Store** — `lib/store-articles.ts` upserts winners into `news_articles`
   (unique on `url, vertical` — the same article can legitimately belong to
   more than one vertical, e.g. a defence/semiconductor crossover story).
6. **Tier for display** — `lib/relevance-tier.ts` computes a cheap keyword
   heuristic (1 = Canada in the headline, 2 = Canada mentioned in the body,
   3 = allied-country coverage with no Canada mention). Both the Supabase
   read path (`lib/get-articles.ts`) and the live HubSpot module
   (`hubspot/modules/news-feed.module/module.html`, via `orderBy=canada_tier`)
   sort on this first, recency second — a HubL bug that sorted purely by
   `-published_at` (ignoring this field entirely) shipped at some point and
   was silently burying genuinely-Canadian stories under higher-volume
   allied-only coverage; fixed 2026-08-17.
7. **Sync to HubDB** — `hubspot/lib/sync-hubdb-sandbox.ts` clears and
   reinserts the sandbox `news_articles` HubDB table from Supabase's current
   contents. Runs as the last step of `scripts/daily-refresh.ts`, so it's
   part of the same daily cron as the fetch.

## Daily automation

`.github/workflows/daily-refresh.yml` runs `scripts/daily-refresh.ts` once a
day (`11:00 UTC` by default — adjust the cron expression in the workflow file
or GitHub's UI). It wipes `news_articles`, refetches all 5 verticals fresh,
then syncs the result into the sandbox HubDB table — so the feed always
reflects the current 72-hour lookback rather than accumulating stale rows
indefinitely. Also runnable on demand from the Actions tab
(`workflow_dispatch`), or locally via `npm run refresh`.

**Requires 5 repository secrets** (Settings → Secrets and variables →
Actions): `PERIGON_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ANTHROPIC_API_KEY`, `HUBSPOT_SANDBOX_PRIVATE_APP_TOKEN` — same values as
`.env.local` / `~/.hubspot_sandbox_private_app_token`. Missing the HubSpot
one doesn't fail the workflow loudly — `syncSandboxHubDb()`'s error is
caught and logged, not thrown, so Supabase refreshes fine while HubDB
silently goes stale. Check the Action's logs, not just its green checkmark,
if the live site looks out of date.

**Budget note:** the guardrail in `lib/request-log.ts` caps requests per
Perigon billing cycle. **The cycle resets on the 16th of each month, not the
1st** (confirmed against the Perigon account dashboard) — `lib/request-log.ts`
anchors its window to that date. Getting this wrong caused a real incident on
2026-08-17: the guardrail was counting from calendar-month start, believed
the (already-reset) new cycle was at 150/150, and let `clearArticles()` wipe
the table before the guarded refetch failed — Supabase and the live HubDB
table were briefly empty until manually recovered. `scripts/daily-refresh.ts`
catches per-vertical fetch failures so one blocked vertical doesn't stop the
others, but it does **not** guard against `clearArticles()` running when the
refetch that follows is doomed to fail — worth hardening if this recurs.

## Folder structure

```
config/clusters/        One file per vertical, typed against lib/types.ts.
                         Tune terms here without touching pipeline code.
lib/
  types.ts               NewsCluster, Perigon response shapes, NewsArticleRow.
  geo-terms.ts            Canada + allied-country term lists, shared by the
                           query builder and the display-tier heuristic.
  query-builder.ts        Cluster -> Perigon `q` boolean string.
  perigon.ts              fetchArticlesForCluster() — the actual API call,
                           budget-gated, logged, excludeLabel spam filter,
                           showReprints=false.
  request-log.ts          Budget guardrail: checks + logs against
                           perigon_request_log before every call. Cycle
                           anchored to the 16th of the month (Perigon's
                           actual reset date), not calendar-month start.
  enrich-articles.ts       Claude Haiku batch call: relevance score + same-
                           event duplicate_group per article.
  select-winners.ts        Applies the relevance threshold, picks one winner
                           per duplicate_group.
  relevance-tier.ts        Cheap keyword heuristic for Canada-primary vs.
                           Canada-mentioned vs. allied-only display ordering.
  store-articles.ts        Upserts scored, deduped articles into news_articles.
  clear-articles.ts        Wipes news_articles (used by the daily refresh).
  get-articles.ts          Reads news_articles for the (currently unused,
                           see "Live frontend") Next.js UI / API route.
  run-fetch.ts             The shared fetch -> enrich -> select -> store
                           sequence every vertical's script calls.
  supabase.ts              Server-side Supabase client (service role key —
                           never exposed to the browser).
scripts/
  fetch-*.ts               One runner per vertical, calls run-fetch. Does
                           NOT clear existing articles first (upsert-only) —
                           safe to run standalone without wiping the table.
  daily-refresh.ts          Clears + refetches all 5 verticals, then syncs
                           HubDB; what the GitHub Actions workflow runs.
hubspot/
  modules/news-feed.module  The live HubSpot module — HubL reads HubDB
                           directly via hubdb_table_rows(), sorted
                           canada_tier then -published_at. Row fields are
                           r.title etc. directly (NOT r.values.title — that's
                           the REST API shape, not HubL's).
  modules/news-subnav.module,
  modules/news-footer.module  Supporting nav/footer modules for the /news page.
  lib/sync-hubdb-sandbox.ts  Clears + reinserts the sandbox HubDB table from
                           Supabase's current news_articles.
  lib/hubspot-token.ts     Reads HUBSPOT_SANDBOX_TOKEN /
                           HUBSPOT_PRODUCTION_TOKEN env vars, falling back
                           to ~/.hubspot_sandbox_private_app_token locally.
  scripts/table-ids.json,
  scripts/module-ids.json  Sandbox HubDB table id + module ids. Production
                           entries are still null — not yet promoted.
app/                       Legacy Next.js UI (app/page.tsx) — superseded by
                           the HubSpot module above. Railway still runs this
                           app, but only for api/articles and api/health;
                           the page route itself isn't the live surface
                           anymore.
  api/articles/route.ts   Public JSON feed (unused by the live HubSpot
                           module, which reads HubDB directly instead).
  api/health/route.ts     Railway healthcheck target.
supabase/migrations/
  0001  news_articles + perigon_request_log tables.
  0002  (url, vertical) composite unique constraint, replacing url-only.
  0003  image_url column.
  0004  canada_tier column + index.
```

## Setup

```bash
npm install
cp .env.example .env.local   # fill in PERIGON_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
```

Run all 4 migrations against your Supabase project, in order (SQL editor, or
the Supabase CLI), then:

```bash
npm run refresh              # clears + refetches all 5 verticals, syncs HubDB
npm run fetch:defence        # or just one vertical (no clear, upsert-only)
npm run hubdb:sync-sandbox   # re-sync HubDB from Supabase without refetching
```

Deploying a HubSpot module change to the sandbox portal:

```bash
hs cms upload hubspot/modules/news-feed.module /hubspot/modules/news-feed.module
```

## Live frontend (HubSpot)

`hubspot/modules/news-feed.module` is the actual live surface — a HubL
module on the sandbox `/news` page that reads the `news_articles` HubDB table
directly via `hubdb_table_rows()`, filtered by `?vertical=` and paginated by
`?page=` (real page navigation, not client-side routing). Sorted
`canada_tier` first, `-published_at` second.

HubSpot's live (non-prerendered) render path caps total HubDB rows a page can
fetch at roughly 20-30 on the sandbox tier — confirmed empirically, not
documented. `PAGE_SIZE` is kept conservative (15) so this never bites.

The `app/` Next.js UI and its `/api/articles` route (below) predate this and
are no longer the live path — kept around on Railway mainly because
`/api/health` needs a running app for Railway's healthcheck, and because nothing
has removed them yet. Don't assume changes to `app/page.tsx` affect what's
actually live on `ngen.ca` or the sandbox portal.

## Deploying to Railway

No Dockerfile needed — Railway's Nixpacks builder auto-detects Next.js.
`railway.json` pins the build/start commands and points the healthcheck at
`/api/health`. `railway.refresh.json` is a second Railway service running
`npm run refresh:railway` on a cron — largely redundant with the GitHub
Actions workflow now; check which one is actually active before assuming both
are running the pipeline daily (double-running would double Perigon spend).

1. Connect the GitHub repo in Railway (auto-deploys on every push to `main`).
2. Env vars: `PERIGON_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   (`ANTHROPIC_API_KEY` isn't needed here — the Railway app only reads from
   Supabase, it doesn't run the fetch/enrichment pipeline itself, unless the
   `railway.refresh.json` cron service is the one actually in use.)
3. Railway sets `PORT` automatically — `next start` respects it, no config.
4. Optionally set `ALLOWED_ORIGIN` (defaults to `*`) and
   `FRAME_ANCESTORS_ORIGINS` (defaults to `*.ngen.ca, *.railway.app,
   *.hubspot.com, *.hs-sites.com, *.hubspotpagebuilder.com,
   *.hubspotpreview.com`) for a different allow-list — only relevant if the
   legacy `app/page.tsx` iframe path is ever revived.

## Legal

**Not resolved yet — don't launch publicly without checking this.** What's
displayed: title, source name, publish date, a short (Perigon-generated)
summary, a hotlinked thumbnail (not re-hosted), and an outbound link. No full
article text is ever stored or shown. This is the standard "headline +
snippet + link out" aggregator pattern, but Perigon's public Terms of
Service explicitly defer redistribution/display rights to "the applicable
API agreement or license" tied to the specific account and plan — which
isn't published anywhere public. **Confirm with Perigon (account rep or
dashboard) or NGen counsel whether the current plan permits public external
display before this goes on ngen.ca**, not just internal/research use.

## Cluster tuning notes

Each cluster config (`config/clusters/*.ts`) has a `flaggedTerms` array
documenting low-confidence calls inline — e.g. Defence Manufacturing
deliberately does *not* exclude conflict-adjacent vocabulary (battlefield,
ceasefire) since real supply-chain stories share it with war reporting, and
relies on the Haiku relevance pass instead of keyword exclusion. Read a
cluster's `flaggedTerms` before assuming its term list is final.

Real gaps found and fixed 2026-08-17, worth knowing about as examples of the
kind of thing to watch for in the other clusters:

- **Cross-vertical gap**: none of the 5 verticals covers general manufacturing
  workforce/policy news (e.g. a minister launching a skills alliance) — it
  matched no cluster's terms at all. Added to Robotics & Automation as the
  least-bad fit (see its `flaggedTerms`); there's no dedicated vertical for
  this and adding a 6th is budget-gated (one Perigon request per vertical per
  day).
- **Redundant geo-suffix terms**: Defence Manufacturing had
  `"defence procurement Canada"` / `"defence contractor Canada"` as exact
  quoted phrases — redundant with (and stricter than) the separate geo
  clause every query already ANDs against. Dropped the "Canada" suffix and
  added plain `defence spending` / `defence budget` / `defence contract` /
  `Arctic defence`, which real coverage uses but the original
  manufacturing-specific compound phrases didn't catch.
- **Precision/recall tradeoff, deliberately accepted**: Semiconductors &
  Electronics was surfacing zero genuinely-Canadian stories. The only real
  anchor (POET Technologies) is ~100:1 drowned in stock-ticker/earnings spam
  that Perigon's `excludeLabel` filter doesn't reliably catch. Added anyway,
  verified live that Haiku's relevance pass correctly rejects the spam and
  lets through the rare genuine manufacturing story.
- **Not every thin vertical is a bug**: Additive Manufacturing had zero
  genuinely-Canadian stories too, but a direct search for known Canadian
  industrial-AM companies (AON3D, Burloak Technologies, Mosaic Manufacturing)
  over 7 days turned up nothing — a real scarcity of news, not a query gap.
  No term change fixes a shortage of real stories; don't chase this one.
