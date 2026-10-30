"""Evaluates every TFM checkpoint on the same test split and prints aggregate metrics as JSON
(per patient, as in the thesis, and per image), so the experiment log of the TFM section
compares versions on equal terms. Reads from the TFM project only; writes nothing there.

    /path/to/tfm/.venv/bin/python scripts/tfm/experiment_metrics.py --tfm /path/to/tfm > metrics.json

The output holds only aggregate numbers (no patient-level data).
"""

import argparse
import json
import sys
from pathlib import Path

# (key, checkpoint relative to outputs/, dataset variant, uses covariates)
CHECKPOINTS = [
    ("v0", "v0 - Sin Data Augmentation/best_phased_full.pt", "full", False),
    ("v1-differential", "v1/best_differential_v1.pt", "full", False),
    ("v1-phased", "v1/best_phased_v1.pt", "full", False),
    ("v2-differential", "v2/best_differential_full.pt", "full", False),
    ("v2-phased", "v2/best_phased_full.pt", "full", False),
    ("v3", "v3 - Dropout 0.5 y weight decay 1e-4/best_phased_full.pt", "full", False),
    ("v4-roi", "v4 - roi/roi/best_phased_roi.pt", "roi", False),
    ("v4-hybrid", "v4 - roi/hybrid/best_phased_roi_hybrid.pt", "roi_hybrid", False),
    ("v5", "v5-agumented/best_phased_augmented.pt", "full", False),
    ("v6", "v6 - hires/best_phased_hires.pt", "hires", False),
    ("v7-inverse", "v7 - Balanceo/inverse/best_phased_full_cwinverse.pt", "full", False),
    ("v7-effective", "best_phased_full_cweffective.pt", "full", False),
    ("v8", "v8 - Covariables/best_phased_full_covars.pt", "full", True),
    ("final", "best_phased_full_covars.pt", "full", True),
    ("final-roi-yolo", "best_phased_roi_yolo_covars.pt", "roi_yolo", True),
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tfm", type=Path, required=True)
    args = parser.parse_args()
    tfm = args.tfm.resolve()
    sys.path.insert(0, str(tfm))

    import contextlib
    import io

    import numpy as np
    import torch
    from sklearn.metrics import confusion_matrix, f1_score, roc_auc_score

    from data.dataloaders import DATASETS, MEDICAL_COVARIATES, make_dataloaders
    from evaluation.evaluate import PROB_COLS, aggregate_by_patient, predict_test
    from models.lumosnet import LumosNet

    device = torch.device("cpu")
    results = {}
    for key, rel, data, covars in CHECKPOINTS:
        ckpt = tfm / "outputs" / rel
        if not ckpt.exists():
            continue
        cols = MEDICAL_COVARIATES if covars else None
        with contextlib.redirect_stdout(io.StringIO()):  # the loaders print their sizes
            loaders = make_dataloaders(batch_size=32, covariate_cols=cols, **DATASETS[data])
        state = torch.load(ckpt, map_location=device)
        model = LumosNet(pretrained=False, num_covariates=len(cols or []))
        if "shared.0.weight" not in state:
            # Checkpoints before the shared 512 block: both heads read the 2048 backbone features.
            in_dim = 2048 + (model.covariate_embed[0].out_features if covars else 0)
            model.shared = torch.nn.Identity()
            model.classifier = LumosNet._head(in_dim, 3, 0.3)
            model.regressor = LumosNet._head(in_dim, 1, 0.3)
        model.load_state_dict(state)
        probs, bmd_pred = predict_test(model, loaders["test"], device, covars)
        meta = loaders["test"].dataset.meta
        agg = aggregate_by_patient(meta, probs, bmd_pred)

        def summary(y, p, prob, bt, bp):
            cm = confusion_matrix(y, p, labels=[0, 1, 2])
            sens = [float(cm[i, i] / cm[i].sum()) for i in range(3)]
            spec = [float((cm.sum() - cm[i].sum() - cm[:, i].sum() + cm[i, i]) / (cm.sum() - cm[i].sum()))
                    for i in range(3)]
            return {
                "n": int(len(y)),
                "acc": round(float((y == p).mean()), 3),
                "f1": round(float(f1_score(y, p, average="macro")), 3),
                "auc": round(float(roc_auc_score(y, prob, multi_class="ovr")), 3),
                "rmse": round(float(np.sqrt(np.mean((bt - bp) ** 2))), 4),
                "pcc": round(float(np.corrcoef(bt, bp)[0, 1]), 3),
                "sens": [round(s, 3) for s in sens],
                "spec": [round(s, 3) for s in spec],
                "confusion": cm.tolist(),
            }

        results[key] = {
            "data": data,
            "covariates": covars,
            "patient": summary(agg["label"].values, agg["pred"].values, agg[PROB_COLS].values,
                               agg["bmd_true"].values, agg["bmd_pred"].values),
            "image": summary(meta["label"].values, probs.argmax(1), probs,
                             meta["bmd"].values, bmd_pred),
        }
        print(key, results[key]["patient"]["acc"], file=sys.stderr)
    print(json.dumps(results, indent=1))


if __name__ == "__main__":
    main()
