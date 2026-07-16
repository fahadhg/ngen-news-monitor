-- NGen Manufacturing News Monitor (POC) — initial schema

create table if not exists news_articles (
  id uuid primary key default gen_random_uuid(),
  vertical text not null,
  title text not null,
  url text not null unique,
  source text,
  published_at timestamptz,
  summary text,
  relevance_score smallint,
  sentiment jsonb,
  raw_perigon_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists news_articles_vertical_score_idx
  on news_articles (vertical, relevance_score desc);

create index if not exists news_articles_published_at_idx
  on news_articles (published_at desc);

-- Perigon request budget guardrail: one row per API call, so we can count
-- cumulative monthly usage against the 150/month free-tier cap before firing
-- the next request. See lib/request-log.ts.
create table if not exists perigon_request_log (
  id bigint generated always as identity primary key,
  vertical text not null,
  request_params jsonb not null,
  result_count integer,
  status text not null check (status in ('ok', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists perigon_request_log_created_at_idx
  on perigon_request_log (created_at desc);
