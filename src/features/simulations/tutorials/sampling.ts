/** Softmax of logits divided by a temperature (T > 0). */
export function softmaxWithTemperature(logits: readonly number[], temperature: number): number[] {
  const scaled = logits.map((l) => l / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max)); // subtract the max: no overflow
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Indices sorted by probability, highest first (stable for ties). */
function byProbability(probs: readonly number[]): number[] {
  return probs.map((_, i) => i).sort((a, b) => (probs[b] ?? 0) - (probs[a] ?? 0) || a - b);
}

/**
 * Which tokens survive top-k and then top-p, in the same order as `generate()` in
 * scripts/tutorials/llm.py: first the k most likely, then top-p over those k *renormalised*,
 * keeping a token while the probability accumulated before it is at most p.
 */
export function keptTokens(probs: readonly number[], topK: number, topP: number): boolean[] {
  const order = byProbability(probs);
  const inTopK = probs.map(() => false);
  for (const i of order.slice(0, topK)) inTopK[i] = true;
  const renormalised = filtered(probs, inTopK);
  const kept = probs.map(() => false);
  let cumulative = 0;
  for (const i of order.slice(0, topK)) {
    if (cumulative > topP) break;
    kept[i] = true;
    cumulative += renormalised[i] ?? 0;
  }
  return kept;
}

/** Probabilities after the filters, renormalised over the surviving tokens. */
export function filtered(probs: readonly number[], kept: readonly boolean[]): number[] {
  const total = probs.reduce((a, p, i) => a + (kept[i] === true ? p : 0), 0);
  return probs.map((p, i) => (kept[i] === true && total > 0 ? p / total : 0));
}

/** Shannon entropy in bits: how many "equally likely options" the model is choosing among (2^H). */
export function entropyBits(probs: readonly number[]): number {
  // max(0, …): a one-hot distribution would otherwise give −0.
  return Math.max(0, -probs.reduce((a, p) => (p > 0 ? a + p * Math.log2(p) : a), 0));
}
