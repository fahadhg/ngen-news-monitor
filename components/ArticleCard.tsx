import type { NewsArticleRow } from "@/lib/types";
import SentimentBadge from "./SentimentBadge";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

const VERTICAL_LABELS: Record<string, string> = {
  "additive-manufacturing": "Additive Manufacturing",
  "robotics-automation": "Robotics & Automation",
  "advanced-materials": "Advanced Materials",
  "defence-manufacturing": "Defence Manufacturing",
  "semiconductors-electronics": "Semiconductors & Electronics",
};

export default function ArticleCard({
  article,
  showVerticalBadge,
}: {
  article: NewsArticleRow;
  showVerticalBadge?: boolean;
}) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-surface-1 border border-border rounded-xl p-4 shadow-card hover:border-ngen-copper/40 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs text-ink-faint mb-2">
        {showVerticalBadge && (
          <>
            <span className="font-medium text-ngen-indigo">
              {VERTICAL_LABELS[article.vertical] ?? article.vertical}
            </span>
            <span>·</span>
          </>
        )}
        <span>{article.source}</span>
        <span>·</span>
        <span>{formatDate(article.published_at)}</span>
      </div>

      <h3 className="font-semibold text-ink leading-snug mb-1.5">{article.title}</h3>

      {article.summary && (
        <p className="text-sm text-ink-muted leading-relaxed line-clamp-3">{article.summary}</p>
      )}

      <div className="mt-3">
        <SentimentBadge sentiment={article.sentiment} />
      </div>
    </a>
  );
}
