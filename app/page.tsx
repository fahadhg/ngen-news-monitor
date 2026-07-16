import { clusters } from "@/config/clusters";
import { getArticles } from "@/lib/get-articles";
import NewsHeader from "@/components/NewsHeader";
import VerticalTabs from "@/components/VerticalTabs";
import ArticleCard from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { vertical } = await searchParams;
  const activeVertical = vertical && clusters.some((c) => c.id === vertical) ? vertical : null;
  const articles = await getArticles({ vertical: activeVertical });

  return (
    <>
      <NewsHeader />
      <VerticalTabs clusters={clusters} active={activeVertical} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5 text-xs text-ink-faint bg-surface-2 border border-border rounded-lg px-3 py-2">
          Preview build: articles below are unfiltered Perigon matches. Relevance scoring hasn&apos;t
          been applied yet, so this list isn&apos;t curated — treat it as raw signal, not a finished feed.
        </div>

        {articles.length === 0 ? (
          <p className="text-ink-muted text-sm py-12 text-center">
            No articles yet for this vertical. Run its fetch script to populate results.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} showVerticalBadge={!activeVertical} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
