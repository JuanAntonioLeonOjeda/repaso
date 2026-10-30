/** A tiny text-processing pipeline (what NLTK does, written by hand so it can run in the page). */

/** A short list of Spanish stopwords; NLTK's has 313. */
export const STOPWORDS = new Set(
  "a al algo ante como con de del el ella ellos en entre era es esa ese esta este esto fue ha hay la las le lo los más me mi muy no nos o para pero por que se si sin su sus también te tu un una uno y ya".split(
    " ",
  ),
);

/** Longest first, so "aciones" is tried before "es". */
const SUFFIXES = [
  "aciones",
  "ación",
  "amente",
  "mente",
  "ando",
  "iendo",
  "ados",
  "adas",
  "idos",
  "ado",
  "ada",
  "ido",
  "ida",
  "es",
  "as",
  "os",
  "a",
  "o",
  "s",
];

/** Lower case and keep runs of letters (accents included): `re.findall(r"\w+", text.lower())`. */
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\p{L}+/gu) ?? [];
}

/**
 * A deliberately naive stemmer: cut the first matching suffix if at least 3 letters remain.
 * Real stemmers (Porter, Snowball) apply ordered rule sets per language.
 */
export function stem(word: string): string {
  const suffix = SUFFIXES.find((s) => word.endsWith(s) && word.length - s.length >= 3);
  return suffix === undefined ? word : word.slice(0, -suffix.length);
}

export interface TextOptions {
  removeStopwords: boolean;
  stemming: boolean;
}

export function processTokens(text: string, options: TextOptions): string[] {
  const tokens = tokenize(text).filter((t) => !options.removeStopwords || !STOPWORDS.has(t));
  return options.stemming ? tokens.map(stem) : tokens;
}

/** `collections.Counter(tokens).most_common(k)`; ties keep first-appearance order, as Counter does. */
export function mostCommon(tokens: readonly string[], k: number): [string, number][] {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
}

export function bigrams(tokens: readonly string[]): string[] {
  return tokens.slice(1).map((t, i) => `${tokens[i] ?? ""} ${t}`);
}
