function quote(term: string): string {
  return term.includes(" ") || term.includes(".") ? `"${term}"` : term;
}

export const CANADA_TERMS = [
  "Canada",
  "Canadian",
  "Ontario",
  "Quebec",
  "British Columbia",
  "Alberta",
  "Manitoba",
  "Saskatchewan",
  "Nova Scotia",
  "New Brunswick",
  "Toronto",
  "Montreal",
  "Vancouver",
  "Ottawa",
  "Calgary",
  "Winnipeg",
  "Edmonton",
  "NGen",
  // Added to widen Canadian recall — the original city list skipped several
  // manufacturing/shipbuilding hubs that generate real vertical-relevant
  // stories (auto assembly, steel, shipbuilding) without necessarily also
  // naming a province. Ambiguous bare names quoted with a disambiguating
  // suffix, same reasoning as ALLIED_TERMS leaving out bare "UK" for the
  // Ukraine collision.
  "Hamilton, Ontario",
  "Windsor, Ontario",
  "Kitchener-Waterloo",
  "Oshawa",
  "Brampton",
  "Sarnia",
  "Sault Ste. Marie",
  "Halifax",
  "Saint John, New Brunswick",
  "St. John's, Newfoundland",
  "Regina",
  "Saskatoon",
  "Surrey, B.C.",
  // Federal program/agency names that show up in manufacturing investment
  // and procurement coverage even when the article never says "Canada"
  // in the headline or summary.
  "Innovation, Science and Economic Development Canada",
  "Business Development Bank of Canada",
  "Export Development Canada",
  "Strategic Innovation Fund",
  "Next Generation Manufacturing Canada",
];

// Manufacturing/trade/defence-industrial news from Canada's largest trading
// partner and major NATO/allied manufacturing peers is relevant even without
// a direct Canada mention. Deliberately short — not all 32 NATO members —
// per "keep it tight". Bare "UK" is left out on purpose: it's a substring of
// "Ukraine", which would misclassify Ukraine-war-supply-chain coverage as
// allied-UK coverage.
export const ALLIED_TERMS = [
  "United States",
  "U.S.",
  "America",
  "American",
  "NATO",
  "Germany",
  "German",
  "United Kingdom",
  "Britain",
  "British",
];

export function orClause(terms: string[]): string {
  return `(${terms.map(quote).join(" OR ")})`;
}

function toMatcher(terms: string[]): (text: string) => boolean {
  const lowered = terms.map((t) => t.toLowerCase());
  return (text: string) => {
    const t = text.toLowerCase();
    return lowered.some((term) => t.includes(term));
  };
}

export const mentionsCanada = toMatcher(CANADA_TERMS);
