"use client";

import { useState } from "react";
import type { ArticleCardData } from "@/lib/types";

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

// No external stock-photo source wired up, so verticals without a Perigon
// image get an on-brand placeholder instead of a blank/broken block —
// distinct color per vertical so the feed stays visually scannable.
const FALLBACK_STYLES: Record<string, string> = {
  "additive-manufacturing": "bg-ngen-indigo",
  "robotics-automation": "bg-ngen-copper",
  "advanced-materials": "bg-[#0D9488]",
  "defence-manufacturing": "bg-[#3A3A3A]",
  "semiconductors-electronics": "bg-[#5B4B8A]",
};

export default function ArticleCard({
  article,
  showVerticalBadge,
}: {
  article: ArticleCardData;
  showVerticalBadge?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = article.image_url && !imageFailed;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-surface-1 border border-border rounded-xl p-4 shadow-card hover:border-ngen-copper/40 transition-colors"
    >
      <div className="-mx-4 -mt-4 mb-3 aspect-[16/9] overflow-hidden rounded-t-xl bg-surface-2">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url!}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center px-4 ${
              FALLBACK_STYLES[article.vertical] ?? "bg-ngen-indigo"
            }`}
          >
            <span className="text-white/90 font-semibold text-sm text-center tracking-tight">
              {VERTICAL_LABELS[article.vertical] ?? "NGen Manufacturing News"}
            </span>
          </div>
        )}
      </div>

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

      {(article.canada_tier === 2 || article.canada_tier === 3) && (
        <div className="mt-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-2 text-ink-muted">
            {article.canada_tier === 2 ? "Canada mention" : "Allied coverage"}
          </span>
        </div>
      )}
    </a>
  );
}
