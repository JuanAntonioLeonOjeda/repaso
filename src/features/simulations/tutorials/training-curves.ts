/** One epoch of a training run, as logged by `fit` in `scripts/tutorials/vision.py`. */
export interface EpochPoint {
  epoch: number;
  trainLoss: number;
  trainAcc: number;
  valLoss: number;
  valAcc: number;
}

export interface TrainingRun {
  key: string;
  label: string;
  epochs: readonly EpochPoint[];
}

/** The epoch `fit` keeps: the highest validation accuracy (the first one on a tie). */
export function bestEpoch(run: TrainingRun): EpochPoint | undefined {
  return run.epochs.reduce<EpochPoint | undefined>(
    (best, p) => (best === undefined || p.valAcc > best.valAcc ? p : best),
    undefined,
  );
}

/**
 * Where overfitting starts to show in the loss: the epoch with the lowest validation loss.
 * After it, train loss keeps falling while validation loss rises.
 */
export function minValLossEpoch(run: TrainingRun): EpochPoint | undefined {
  return run.epochs.reduce<EpochPoint | undefined>(
    (best, p) => (best === undefined || p.valLoss < best.valLoss ? p : best),
    undefined,
  );
}

/** Train minus validation accuracy, in percentage points: how much the model memorises. */
export function accuracyGap(point: EpochPoint): number {
  return (point.trainAcc - point.valAcc) * 100;
}

/** Top of the loss axis: the largest loss of any run, rounded up to the next half, so no curve is clipped. */
export function lossAxisMax(runs: readonly TrainingRun[]): number {
  const losses = runs.flatMap((r) => r.epochs.flatMap((p) => [p.trainLoss, p.valLoss]));
  return Math.max(0.5, Math.ceil(Math.max(0, ...losses) * 2) / 2);
}
