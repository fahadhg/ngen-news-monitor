export default function SentimentBadge({
  sentiment,
}: {
  sentiment: { positive: number; negative: number; neutral: number } | null;
}) {
  if (!sentiment) return null;

  const entries = Object.entries(sentiment) as [keyof typeof sentiment, number][];
  const [dominant, value] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));

  // Weak/mixed signals aren't worth surfacing as a confident label.
  if (value < 0.45) return null;

  const styles: Record<string, string> = {
    positive: "bg-positive-muted text-positive",
    negative: "bg-negative-muted text-negative",
    neutral: "bg-surface-2 text-ink-muted",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[dominant]}`}>
      {dominant}
    </span>
  );
}
