import { describe, expect, it } from "vitest";

import {
  accuracyGap,
  bestEpoch,
  lossAxisMax,
  minValLossEpoch,
  type TrainingRun,
} from "./training-curves";
import { visionRuns } from "./vision-runs";

const point = (
  epoch: number,
  valAcc: number,
  valLoss: number,
  trainAcc = 0.9,
): TrainingRun["epochs"][number] => ({
  epoch,
  trainLoss: 0.5,
  trainAcc,
  valLoss,
  valAcc,
});

describe("training curves", () => {
  const run: TrainingRun = {
    key: "toy",
    label: "toy",
    epochs: [point(1, 0.6, 1.2), point(2, 0.75, 0.8), point(3, 0.75, 0.9), point(4, 0.7, 1.1)],
  };

  it("keeps the first epoch with the best validation accuracy, as fit does", () => {
    expect(bestEpoch(run)?.epoch).toBe(2);
  });

  it("finds the epoch with the lowest validation loss", () => {
    expect(minValLossEpoch(run)?.epoch).toBe(2);
  });

  it("measures the train-validation gap in percentage points", () => {
    expect(accuracyGap(point(1, 0.82, 0.5, 0.98))).toBeCloseTo(16);
  });

  it("returns nothing for an empty run", () => {
    const empty: TrainingRun = { key: "e", label: "e", epochs: [] };
    expect(bestEpoch(empty)).toBeUndefined();
    expect(minValLossEpoch(empty)).toBeUndefined();
  });

  it("keeps the first epoch on a validation-loss tie", () => {
    const tie: TrainingRun = {
      key: "t",
      label: "t",
      epochs: [point(1, 0.5, 0.7), point(2, 0.6, 0.7)],
    };
    expect(minValLossEpoch(tie)?.epoch).toBe(1);
  });

  it("rounds the loss axis up to the next half so no curve is clipped", () => {
    expect(lossAxisMax([run])).toBe(1.5);
    expect(lossAxisMax(visionRuns)).toBe(2.5); // the MLP's validation loss peaks at 2.314
  });
});

// The lessons of src/content/vision/ quote these numbers (02, 03, 05): regenerate both together.
describe("Visión runs (generated from scripts/tutorials/vision.py)", () => {
  it("has the four models of the tutorial with consecutive epochs", () => {
    expect(visionRuns.map((r) => r.key)).toEqual(["mlp", "cnn", "cnn_reg", "resnet"]);
    for (const r of visionRuns) {
      expect(r.epochs.map((p) => p.epoch)).toEqual(r.epochs.map((_, i) => i + 1));
    }
  });

  it("matches the numbers quoted in the lessons", () => {
    const [mlp, cnn] = visionRuns;
    expect(mlp && bestEpoch(mlp)).toMatchObject({ epoch: 16, valAcc: 0.54 });
    expect(cnn && bestEpoch(cnn)).toMatchObject({ epoch: 6, valAcc: 0.8262 });
    expect(mlp && minValLossEpoch(mlp)?.epoch).toBe(5);
  });
});
