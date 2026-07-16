-- An article can legitimately belong to more than one vertical (e.g. a
-- "defence semiconductor chip plant" story matches both Defence Manufacturing
-- and Semiconductors & Electronics). The original `url unique` constraint
-- meant the second vertical's fetch silently overwrote the first's row
-- in place instead of storing both — caught when additive-manufacturing's
-- row count dropped by one after the other verticals were fetched.

alter table news_articles drop constraint news_articles_url_key;
alter table news_articles add constraint news_articles_url_vertical_key unique (url, vertical);
