import Link from "next/link";
import type { NewsCluster } from "@/lib/types";

export default function VerticalTabs({
  clusters,
  active,
}: {
  clusters: NewsCluster[];
  active: string | null;
}) {
  const tabs = [{ id: null, name: "All" }, ...clusters.map((c) => ({ id: c.id, name: c.name }))];

  return (
    <nav className="border-b border-border bg-surface-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-12 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const href = tab.id ? `/?vertical=${tab.id}` : "/";
          return (
            <Link
              key={tab.name}
              href={href}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-ngen-indigo text-white"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
