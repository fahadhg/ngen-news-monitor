# NGen Manufacturing News Monitor

Daily-refreshed feed of Canada-relevant manufacturing news across 5 verticals.
Perigon supplies raw articles, Claude Haiku scores relevance and collapses
cross-outlet duplicates of the same event, Supabase stores the winners, and a
Next.js app on Railway serves them — as a page to iframe or a JSON API for a
native HubSpot module.

**Live:** `ngen-news-monitor-production.up.railway.app` · Repo: `github.com/fahadhg/ngen-news-monitor` (private)

## Status

- [x] All 5 verticals live: Additive Manufacturing, Robotics & Automation,
      Advanced Materials, Defence Manufacturing, Semiconductors & Electronics
- [x] Canada + allied-country geo scope (content clause, not a hard source-
      country filter — see "How the pipeline works")
- [x] Wire-syndication collapse (`showReprints=false`)
- [x] Claude Haiku relevance scoring (1–10, threshold 7) + cross-outlet
      same-event dedup, batched per vertical
- [x] Supabase storage, budget-guarded Perigon calls, Next.js UI + JSON API
- [x] Railway deploy + HubSpot iframe/CORS support
- [x] Daily GitHub Actions refresh (`.github/workflows/daily-refresh.yml`)
- [ ] Legal sign-off on public display rights — see "Legal" below. **Don't
      treat the live Railway URL as cleared for embedding on ngen.ca yet.**

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
   3 = allied-country coverage with no Canada mention) so the UI can sort
   Canada-primary stories first without waiting on a second AI pass.

## Daily automation

`.github/workflows/daily-refresh.yml` runs `scripts/daily-refresh.ts` once a
day (`11:00 UTC` by default — adjust the cron expression in the workflow file
or GitHub's UI). It wipes `news_articles` and refetches all 5 verticals fresh,
so the feed always reflects the current 72-hour lookback rather than
accumulating stale rows indefinitely. Also runnable on demand from the
Actions tab (`workflow_dispatch`), or locally via `npm run refresh`.

**Requires 4 repository secrets** (Settings → Secrets and variables →
Actions): `PERIGON_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ANTHROPIC_API_KEY` — same values as `.env.local`.

**Budget note:** 5 requests/day × 30 days = 150/month exactly. On a 31-day
month, the last day's run will hit the cap partway through and
`lib/request-log.ts`'s guardrail blocks the overage outright (that vertical's
refresh just fails for that one day, logged, not silently over spent) —
self-corrects the next month. `scripts/daily-refresh.ts` catches per-vertical
failures so one blocked vertical doesn't stop the others from attempting.

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
                           perigon_request_log before every call.
  enrich-articles.ts       Claude Haiku batch call: relevance score + same-
                           event duplicate_group per article.
  select-winners.ts        Applies the relevance threshold, picks one winner
                           per duplicate_group.
  relevance-tier.ts        Cheap keyword heuristic for Canada-primary vs.
                           Canada-mentioned vs. allied-only display ordering.
  store-articles.ts        Upserts scored, deduped articles into news_articles.
  clear-articles.ts        Wipes news_articles (used by the daily refresh).
  get-articles.ts          Reads news_articles for the UI / API route.
  run-fetch.ts             The shared fetch -> enrich -> select -> store
                           sequence every vertical's script calls.
  supabase.ts              Server-side Supabase client (service role key —
                           never exposed to the browser).
scripts/
  fetch-*.ts               One runner per vertical, calls run-fetch.
  daily-refresh.ts          Clears + refetches all 5 verticals; what the
                           GitHub Actions workflow runs.
app/
  page.tsx                Newsroom feed UI — server-rendered, filterable by
                           vertical via ?vertical= query param, sorted by
                           Canada tier then recency.
  api/articles/route.ts   Public JSON feed (for a HubSpot custom module).
  api/health/route.ts     Railway healthcheck target.
components/                NewsHeader, VerticalTabs, ArticleCard.
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
npm run refresh          # clears + refetches all 5 verticals, once
npm run fetch:defence    # or just one vertical
npm run dev               # UI at localhost:3000
```

## UI

`app/page.tsx` is a server-rendered feed: NGen-branded header, vertical
filter tabs, article cards (thumbnail — real or an on-brand color-block
fallback when Perigon didn't return an image — title linking out to the
source, source domain + date, summary, a "Canada mention"/"Allied coverage"
badge when the story isn't Canada-primary). Design tokens (NGen
copper/indigo/ocean palette, Inter, card shadows) match `ngen-trade-intel`'s
`tailwind.config.ts`/`globals.css`.

`relevance_score` and `sentiment` are deliberately **not** passed to the
client-rendered `ArticleCard` — `app/page.tsx` trims each row to only the
fields actually displayed before handing it to the Client Component, so
those internal scoring signals never land in the page's hydration payload,
even though nothing renders them visually.

## Deploying to Railway

No Dockerfile needed — Railway's Nixpacks builder auto-detects Next.js.
`railway.json` pins the build/start commands and points the healthcheck at
`/api/health`.

1. Connect the GitHub repo in Railway (auto-deploys on every push to `main`).
2. Env vars: `PERIGON_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   (`ANTHROPIC_API_KEY` isn't needed here — the Railway app only reads from
   Supabase, it doesn't run the fetch/enrichment pipeline itself. That's the
   GitHub Actions workflow's job.)
3. Railway sets `PORT` automatically — `next start` respects it, no config.
4. Optionally set `ALLOWED_ORIGIN` (defaults to `*`) and
   `FRAME_ANCESTORS_ORIGINS` (defaults to `*.ngen.ca, *.railway.app,
   *.hubspot.com, *.hs-sites.com, *.hubspotpagebuilder.com,
   *.hubspotpreview.com`) for a different allow-list.

## Embedding in HubSpot

**Iframe the page directly** — `next.config.ts` sends a
`Content-Security-Policy: frame-ancestors` header (not `X-Frame-Options`,
which doesn't support multi-origin allow-lists) permitting embedding from the
HubSpot domains above.

**Build a custom HubSpot module** — fetch `GET /api/articles`
(`?vertical=<id>&limit=<n>`), open CORS by default. Response shape:
`{ "articles": [{ id, vertical, title, url, source, published_at, summary,
image_url, relevance_score, sentiment, created_at }] }`.

Unlike `ngen-trade-intel` (member-gated), this feed is intentionally public —
no auth/middleware layer.

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
