alter table news_articles add column if not exists canada_tier smallint;

create index if not exists news_articles_vertical_tier_idx
  on news_articles (vertical, canada_tier, published_at desc);
