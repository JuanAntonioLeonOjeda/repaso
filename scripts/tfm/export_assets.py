"""Exports the TFM images used by the "TFM" section into public/tfm-local/ (git- and
docker-ignored: they come from patients of the LUMOS dataset and stay on this machine).

It only READS from the TFM project and must run with the TFM's own environment (PyTorch,
pytorch-grad-cam, OpenCV, pydicom):

    /path/to/tfm/.venv/bin/python scripts/tfm/export_assets.py --tfm /path/to/tfm

Output: public/tfm-local/manifest.json plus PNGs (inputs, activation maps per ResNet stage
for the ImageNet and fine-tuned backbones, Grad-CAM per stage, experiment plots).
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np

REPASO = Path(__file__).resolve().parents[2]
OUT = REPASO / "public" / "tfm-local"
STAGES = ["conv1", "layer1", "layer2", "layer3", "layer4"]
CHANNELS_PER_STAGE = 8
CLASS_NAMES = ["Sano", "Osteopenia", "Osteoporosis"]

# Experiment folders of outputs/ and how each one is presented in the section.
EXPERIMENTS = [
    ("v0", "v0 - Sin Data Augmentation", "phased_full"),
    ("v1-differential", "v1", "differential_v1"),
    ("v1-phased", "v1", "phased_v1"),
    ("v2-differential", "v2", "differential_full"),
    ("v2-phased", "v2", "phased_full"),
    ("v3", "v3 - Dropout 0.5 y weight decay 1e-4", "phased_full"),
    ("v5", "v5-agumented", "phased_augmented"),
    ("v6", "v6 - hires", "phased_hires"),
    ("v8", "v8 - Covariables", "phased_full_covars"),
    ("final-cweffective", ".", "phased_full_cweffective"),
    ("final-roi-yolo", ".", "phased_roi_yolo_covars"),
]
PLOTS = {"history": "history_{}.png", "confusion": "confusion_{}.png", "scatter": "bmd_scatter_{}.png"}


def save_gray(path: Path, array: np.ndarray) -> None:
    """Min-max normalises a 2D array to 8 bits and saves it as PNG."""
    a = array.astype(np.float32)
    lo, hi = float(a.min()), float(a.max())
    a = (a - lo) / (hi - lo) if hi > lo else np.zeros_like(a)
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), (a * 255).astype(np.uint8))


def copy_plots(tfm: Path) -> dict:
    found = {}
    for key, folder, tag in EXPERIMENTS:
        entry = {}
        for kind, pattern in PLOTS.items():
            src = tfm / "outputs" / folder / pattern.format(tag)
            if src.exists():
                dst = OUT / "experimentos" / f"{key}-{kind}.png"
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(src, dst)
                entry[kind] = f"experimentos/{dst.name}"
        if entry:
            found[key] = entry
    extras = {
        "gradcam-grid": tfm / "heatmaps" / "grid.png",
        "gradcam-grid-covars": tfm / "heatmaps" / "grid_covars.png",
        "roi-grid": tfm / "data" / "roi_scripts" / "outputs" / "roi_grid_preview.png",
        "yolo-preview": tfm / "res" / "yolo_dataset" / "preview_grid.png",
        "yolo-results": tfm / "runs" / "detect" / "res" / "yolo_dataset" / "lumbar_detector" / "results.png",
    }
    for key, src in extras.items():
        if src.exists():
            dst = OUT / "extra" / f"{key}{src.suffix}"
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(src, dst)
            found[key] = {"image": f"extra/{dst.name}"}
    return found


def pick_samples(meta, views) -> list:
    """One AP test image per class plus the lateral view of the first one."""
    test = meta[meta["split"] == "test"].merge(views[["image_path", "view"]], on="image_path", how="left")
    picks = []
    for label in range(3):
        rows = test[(test["label"] == label) & (test["view"] == "AP")]
        if len(rows):
            picks.append(rows.iloc[len(rows) // 2])
    if picks:
        lateral = test[(test["patient_id"] == picks[0]["patient_id"]) & (test["view"] == "LAT")]
        if len(lateral):
            picks.append(lateral.iloc[0])
    return picks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tfm", type=Path, required=True)
    parser.add_argument("--checkpoint", default="best_phased_full_covars.pt")
    args = parser.parse_args()
    tfm = args.tfm.resolve()
    sys.path.insert(0, str(tfm))

    import pandas as pd
    import torch
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

    from data.df_import import read_image
    from data.df_preprocess import IMG_SIZE
    from data.lumos_dataset import build_transforms, gray_to_rgb
    from evaluation.gradcam import _BMDOutputWrapper, _ClassificationOutputWrapper, _RegressionTarget
    from models.lumosnet import LumosNet

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    manifest = {"experiments": copy_plots(tfm), "samples": []}

    meta = pd.read_csv(tfm / "res" / "processed" / "metadata.csv")
    views = pd.read_csv(tfm / "res" / "processed" / "view_labels.csv")
    images = np.load(tfm / "res" / "processed" / "images.npy")
    stats = json.loads((tfm / "outputs" / args.checkpoint.replace(".pt", "_covariates.json")).read_text())

    device = torch.device("cpu")  # deterministic and enough for a handful of images
    tuned = LumosNet(pretrained=False, num_covariates=len(stats["covariates"]))
    state = torch.load(tfm / "outputs" / args.checkpoint, map_location=device)
    tuned.load_state_dict(state.get("model_state_dict", state) if isinstance(state, dict) else state)
    tuned.eval()
    imagenet = LumosNet(pretrained=True, num_covariates=0).eval()  # the starting point of fine-tuning

    transform = build_transforms(train=False)

    for n, row in enumerate(pick_samples(meta, views)):
        sid = f"muestra-{n + 1}"
        folder = OUT / "muestras" / sid
        raw = cv2.resize((read_image(row["image_path"]) * 255).astype(np.uint8), (IMG_SIZE, IMG_SIZE),
                         interpolation=cv2.INTER_AREA)
        processed = images[int(row["idx"])]
        save_gray(folder / "raw.png", raw)
        save_gray(folder / "input.png", processed)

        x = transform(gray_to_rgb(processed)).unsqueeze(0)
        cov_values = []
        for col in stats["covariates"]:
            value = row[col]
            if col in stats.get("codes", {}):
                value = stats["codes"][col][str(value).lower()]
            cov_values.append((float(value) - stats["mean"][col]) / stats["std"][col])
        cov = torch.tensor([cov_values], dtype=torch.float32)

        # Activations of each ResNet stage, for both backbones, on the same channels
        captured = {}

        def hook(name):
            def fn(_module, _inp, out):
                captured[name] = out.detach()[0]
            return fn

        layers = {}
        for model_name, model in (("tuned", tuned), ("imagenet", imagenet)):
            handles = []
            for stage in STAGES:
                module = model.backbone.relu if stage == "conv1" else getattr(model.backbone, stage)
                handles.append(module.register_forward_hook(hook(f"{model_name}:{stage}")))
            with torch.no_grad():
                if model_name == "tuned":
                    logits, bmd = model(x, cov)
                    probs = torch.softmax(logits, dim=1)[0].tolist()
                    bmd_pred = float(bmd[0])
                else:
                    model.backbone(x)
            for h in handles:
                h.remove()

        for stage in STAGES:
            act = captured[f"tuned:{stage}"]
            # Channels with the most spatial structure (std), not the highest mean: those show what
            # the stage responds to; high-mean channels are often uniformly "on" and look like noise.
            strongest = torch.argsort(act.std(dim=(1, 2)), descending=True)[:CHANNELS_PER_STAGE].tolist()
            for model_name in ("tuned", "imagenet"):
                maps = captured[f"{model_name}:{stage}"]
                save_gray(folder / model_name / stage / "mean.png", maps.mean(dim=0).numpy())
                for c in strongest:
                    save_gray(folder / model_name / stage / f"c{c}.png", maps[c].numpy())
            layers[stage] = {
                "size": int(act.shape[-1]),
                "channels": int(act.shape[0]),
                "shown": strongest,
            }

        # Grad-CAM at three depths, for the predicted class and for the BMD head
        cams = {}
        predicted = int(np.argmax(probs))
        for target in ("classification", "bmd"):
            wrapper = (_ClassificationOutputWrapper(tuned, cov) if target == "classification"
                       else _BMDOutputWrapper(tuned, cov)).eval()
            cam_target = ClassifierOutputTarget(predicted) if target == "classification" else _RegressionTarget()
            for stage in ("layer2", "layer3", "layer4"):
                layer = getattr(tuned.backbone, stage)[-1]
                with GradCAM(model=wrapper, target_layers=[layer]) as cam:
                    grayscale = cam(input_tensor=x, targets=[cam_target])[0]
                save_gray(folder / "gradcam" / f"{target}-{stage}.png", grayscale)
                cams.setdefault(target, []).append(stage)

        manifest["samples"].append({
            "id": sid,
            "view": str(row.get("view", "")),
            "trueClass": CLASS_NAMES[int(row["label"])],
            "trueBmd": round(float(row["bmd"]), 3),
            "tScore": round(float(row["t_value"]), 2),
            "probs": [round(p, 3) for p in probs],
            "predictedClass": CLASS_NAMES[predicted],
            "predictedBmd": round(bmd_pred, 3),
            "layers": layers,
            "gradcam": cams,
        })
        print(f"{sid}: {manifest['samples'][-1]['trueClass']} -> {CLASS_NAMES[predicted]}")

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"Written {OUT}")


if __name__ == "__main__":
    main()
