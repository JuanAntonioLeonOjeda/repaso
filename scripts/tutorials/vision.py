"""Runs the code of the "Visión" tutorial end to end (CIFAR-10 with PyTorch), so every number
the lessons quote comes from a real run. It needs torch and torchvision (the TFM's environment
has them); it downloads CIFAR-10 (~170 MB) and the ResNet-18 ImageNet weights (~45 MB).

    /path/to/tfm/.venv/bin/python scripts/tutorials/vision.py --data /tmp/cifar --out /tmp/vision

Steps (each one a lesson): data statistics, MLP baseline, plain CNN, CNN with augmentation
and regularisation, transfer learning with ResNet-18, evaluation on test, save and reload, and
a grid of the most confident test errors (copied to public/tutorials/vision/errores.png).
Training curves for the app: scripts/tutorials/vision_curves.py.
`--only <step>` runs one step; `--quick` trains on a small subset to try the script.
The output is a JSON file with the metrics and training curves of every step.
"""

import argparse
import json
import random
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms

SEED = 42
CLASSES = ["avión", "coche", "pájaro", "gato", "ciervo", "perro", "rana", "caballo", "barco", "camión"]

# Per-channel mean and std of the CIFAR-10 training images (recomputed by `data_stats`).
CIFAR_MEAN = (0.4914, 0.4822, 0.4465)
CIFAR_STD = (0.2470, 0.2435, 0.2616)
# ResNet-18 was trained on ImageNet with these statistics: its inputs must use them.
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


# ---------------------------------------------------------------------------------------------
# Lesson 1: data


def seed_everything(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def pick_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def split_indices(n: int, n_val: int, seed: int = SEED) -> tuple[list[int], list[int]]:
    """The same train/validation split for every model, so their numbers are comparable."""
    perm = torch.randperm(n, generator=torch.Generator().manual_seed(seed)).tolist()
    return perm[n_val:], perm[:n_val]


def data_stats(root: Path) -> dict:
    raw = datasets.CIFAR10(root, train=True, download=True)
    pixels = torch.tensor(raw.data, dtype=torch.float32) / 255  # (50000, 32, 32, 3)
    mean = pixels.mean(dim=(0, 1, 2))
    std = pixels.std(dim=(0, 1, 2))
    counts = np.bincount(np.array(raw.targets), minlength=10)
    return {
        "train_shape": list(raw.data.shape),
        "test_size": len(datasets.CIFAR10(root, train=False, download=True)),
        "mean": [round(v, 4) for v in mean.tolist()],
        "std": [round(v, 4) for v in std.tolist()],
        "class_counts": counts.tolist(),
    }


def make_loaders(
    root: Path,
    train_tf: transforms.Compose,
    eval_tf: transforms.Compose,
    batch_size: int,
    quick: bool,
) -> tuple[DataLoader, DataLoader, DataLoader]:
    # Two views of the same training files: augmented for training, plain for validation.
    # Splitting one dataset object would apply the training augmentation to validation too.
    train_full = datasets.CIFAR10(root, train=True, download=True, transform=train_tf)
    val_full = datasets.CIFAR10(root, train=True, download=True, transform=eval_tf)
    test = datasets.CIFAR10(root, train=False, download=True, transform=eval_tf)
    train_idx, val_idx = split_indices(len(train_full), n_val=5000)
    if quick:
        train_idx, val_idx = train_idx[:2000], val_idx[:500]
        test = Subset(test, range(1000))
    loader = {"batch_size": batch_size, "num_workers": 4, "persistent_workers": True}
    return (
        DataLoader(Subset(train_full, train_idx), shuffle=True, **loader),
        DataLoader(Subset(val_full, val_idx), shuffle=False, **loader),
        DataLoader(test, shuffle=False, **loader),
    )


def cifar_transforms(augment: bool) -> tuple[transforms.Compose, transforms.Compose]:
    normalize = [transforms.ToTensor(), transforms.Normalize(CIFAR_MEAN, CIFAR_STD)]
    eval_tf = transforms.Compose(normalize)
    if not augment:
        return eval_tf, eval_tf
    train_tf = transforms.Compose(
        [transforms.RandomCrop(32, padding=4), transforms.RandomHorizontalFlip(), *normalize]
    )
    return train_tf, eval_tf


def imagenet_transforms(size: int) -> tuple[transforms.Compose, transforms.Compose]:
    normalize = [transforms.ToTensor(), transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)]
    train_tf = transforms.Compose(
        [
            transforms.Resize(size),
            transforms.RandomCrop(size, padding=size // 8),
            transforms.RandomHorizontalFlip(),
            *normalize,
        ]
    )
    eval_tf = transforms.Compose([transforms.Resize(size), *normalize])
    return train_tf, eval_tf


# ---------------------------------------------------------------------------------------------
# Lessons 2-3: models


class MLP(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Flatten(),  # (B, 3, 32, 32) -> (B, 3072)
            nn.Linear(3 * 32 * 32, 512),
            nn.ReLU(),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, 10),  # logits: no softmax, CrossEntropyLoss applies it
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def conv_block(c_in: int, c_out: int) -> nn.Sequential:
    return nn.Sequential(
        nn.Conv2d(c_in, c_out, kernel_size=3, padding=1),
        nn.BatchNorm2d(c_out),
        nn.ReLU(),
        nn.Conv2d(c_out, c_out, kernel_size=3, padding=1),
        nn.BatchNorm2d(c_out),
        nn.ReLU(),
        nn.MaxPool2d(2),  # halves height and width
    )


class SmallCNN(nn.Module):
    def __init__(self, dropout: float = 0.0) -> None:
        super().__init__()
        self.features = nn.Sequential(
            conv_block(3, 32),  # (B, 32, 16, 16)
            conv_block(32, 64),  # (B, 64, 8, 8)
            conv_block(64, 128),  # (B, 128, 4, 4)
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),  # (B, 2048)
            nn.Dropout(dropout),
            nn.Linear(128 * 4 * 4, 10),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))


def resnet18_for_cifar(freeze: bool) -> nn.Module:
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    if freeze:
        for p in model.parameters():
            p.requires_grad = False
    model.fc = nn.Linear(model.fc.in_features, 10)  # new head, trainable
    return model


def count_params(model: nn.Module, trainable_only: bool = False) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad or not trainable_only)


# ---------------------------------------------------------------------------------------------
# Lesson 4: training


def train_one_epoch(model, loader, loss_fn, optimizer, device, scheduler=None) -> dict:
    model.train()  # dropout on, batch norm uses batch statistics
    total_loss, correct, seen = 0.0, 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        logits = model(x)
        loss = loss_fn(logits, y)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if scheduler is not None:
            scheduler.step()  # OneCycleLR moves the learning rate every batch
        total_loss += loss.item() * len(y)
        correct += (logits.argmax(dim=1) == y).sum().item()
        seen += len(y)
    return {"loss": total_loss / seen, "acc": correct / seen}


@torch.no_grad()
def evaluate(model, loader, loss_fn, device) -> dict:
    model.eval()  # dropout off, batch norm uses its running statistics
    total_loss, correct, seen = 0.0, 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        logits = model(x)
        total_loss += loss_fn(logits, y).item() * len(y)
        correct += (logits.argmax(dim=1) == y).sum().item()
        seen += len(y)
    return {"loss": total_loss / seen, "acc": correct / seen}


def fit(model, train_loader, val_loader, *, epochs, optimizer, device, ckpt, scheduler=None, patience=None):
    """Trains, keeps the weights of the best validation epoch and stops early if asked."""
    loss_fn = nn.CrossEntropyLoss()
    history, best_acc, since_best = [], -1.0, 0
    for epoch in range(1, epochs + 1):
        start = time.perf_counter()
        train = train_one_epoch(model, train_loader, loss_fn, optimizer, device, scheduler)
        val = evaluate(model, val_loader, loss_fn, device)
        history.append({"epoch": epoch, "train": train, "val": val})
        print(
            f"  época {epoch:2d}  train loss {train['loss']:.3f} acc {train['acc']:.3f}  "
            f"val loss {val['loss']:.3f} acc {val['acc']:.3f}  ({time.perf_counter() - start:.0f}s)",
            flush=True,
        )
        if val["acc"] > best_acc:
            best_acc, since_best = val["acc"], 0
            torch.save(model.state_dict(), ckpt)
        else:
            since_best += 1
            if patience is not None and since_best >= patience:
                print(f"  early stopping: {patience} épocas sin mejorar")
                break
    model.load_state_dict(torch.load(ckpt, map_location=device))
    best_epoch = max(history, key=lambda h: h["val"]["acc"])["epoch"]
    return {"history": history, "best_val_acc": best_acc, "best_epoch": best_epoch}


# ---------------------------------------------------------------------------------------------
# Lesson 7: evaluation


@torch.no_grad()
def predict_all(model, loader, device) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    model.eval()
    ys, preds, confs = [], [], []
    for x, y in loader:
        probs = torch.softmax(model(x.to(device)), dim=1).cpu()
        conf, pred = probs.max(dim=1)
        ys.append(y)
        preds.append(pred)
        confs.append(conf)
    return torch.cat(ys).numpy(), torch.cat(preds).numpy(), torch.cat(confs).numpy()


def confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, k: int = 10) -> np.ndarray:
    cm = np.zeros((k, k), dtype=int)
    np.add.at(cm, (y_true, y_pred), 1)  # rows: true class, columns: predicted
    return cm


def report(y_true: np.ndarray, y_pred: np.ndarray, conf: np.ndarray) -> dict:
    cm = confusion_matrix(y_true, y_pred)
    recall = cm.diagonal() / cm.sum(axis=1)
    precision = cm.diagonal() / np.maximum(cm.sum(axis=0), 1)
    off = cm.copy()
    np.fill_diagonal(off, 0)
    pairs = sorted(
        ((int(off[i, j]), CLASSES[i], CLASSES[j]) for i in range(10) for j in range(10) if i != j),
        reverse=True,
    )[:5]
    wrong = y_true != y_pred
    top_wrong = [i for i in np.argsort(-conf) if wrong[i]][:12]
    return {
        "accuracy": float((~wrong).mean()),
        "per_class": {
            c: {"precision": round(float(p), 3), "recall": round(float(r), 3)}
            for c, p, r in zip(CLASSES, precision, recall)
        },
        "most_confused": [{"true": t, "pred": p, "count": n} for n, t, p in pairs],
        "confusion_matrix": cm.tolist(),
        "mean_conf_right": float(conf[~wrong].mean()),
        "mean_conf_wrong": float(conf[wrong].mean()),
        "wrong_over_90": int((wrong & (conf > 0.9)).sum()),
        "most_confident_errors": [
            {"index": int(i), "true": CLASSES[y_true[i]], "pred": CLASSES[y_pred[i]],
             "conf": round(float(conf[i]), 3)}
            for i in top_wrong
        ],
    }


# ---------------------------------------------------------------------------------------------
# Steps


def run_mlp(args, device) -> dict:
    seed_everything()
    train_l, val_l, _ = make_loaders(args.data, *cifar_transforms(False), 128, args.quick)
    model = MLP().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
    out = fit(model, train_l, val_l, epochs=args.epochs(20), optimizer=opt, device=device,
              ckpt=args.out / "mlp.pt")
    return {"params": count_params(model), **out}


def run_cnn(args, device) -> dict:
    seed_everything()
    train_l, val_l, _ = make_loaders(args.data, *cifar_transforms(False), 128, args.quick)
    model = SmallCNN().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
    out = fit(model, train_l, val_l, epochs=args.epochs(20), optimizer=opt, device=device,
              ckpt=args.out / "cnn.pt")
    return {"params": count_params(model), **out}


def run_cnn_regularized(args, device) -> dict:
    seed_everything()
    train_l, val_l, _ = make_loaders(args.data, *cifar_transforms(True), 128, args.quick)
    model = SmallCNN(dropout=0.3).to(device)
    epochs = args.epochs(30)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=5e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(
        opt, max_lr=3e-3, epochs=epochs, steps_per_epoch=len(train_l)
    )
    out = fit(model, train_l, val_l, epochs=epochs, optimizer=opt, device=device,
              ckpt=args.out / "cnn_reg.pt", scheduler=sched)
    return {"params": count_params(model), **out}


def run_transfer(args, device) -> dict:
    size = args.size
    seed_everything()
    train_l, val_l, _ = make_loaders(args.data, *imagenet_transforms(size), 64, args.quick)
    # Phase 1: feature extraction, only the new head learns.
    model = resnet18_for_cifar(freeze=True).to(device)
    trainable = count_params(model, trainable_only=True)
    opt = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)
    phase1 = fit(model, train_l, val_l, epochs=args.epochs(3), optimizer=opt, device=device,
                 ckpt=args.out / "resnet_head.pt")
    # Phase 2: fine-tuning, everything learns with a small learning rate.
    for p in model.parameters():
        p.requires_grad = True
    opt = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    phase2 = fit(model, train_l, val_l, epochs=args.epochs(3), optimizer=opt, device=device,
                 ckpt=args.out / "resnet_ft.pt")
    return {
        "size": size,
        "params": count_params(model),
        "trainable_phase1": trainable,
        "feature_extraction": phase1,
        "fine_tuning": phase2,
    }


def run_evaluate(args, device) -> dict:
    """Test once, at the end, for the CNN and for ResNet-18 (if their checkpoints exist)."""
    results = {}
    candidates = [
        ("cnn_reg", SmallCNN(dropout=0.3), cifar_transforms(False), args.out / "cnn_reg.pt"),
        ("resnet_ft", resnet18_for_cifar(freeze=False), imagenet_transforms(args.size),
         args.out / "resnet_ft.pt"),
    ]
    for name, model, tfs, ckpt in candidates:
        if not ckpt.exists():
            continue
        _, _, test_l = make_loaders(args.data, *tfs, 256, args.quick)
        model.load_state_dict(torch.load(ckpt, map_location=device))
        y, pred, conf = predict_all(model.to(device), test_l, device)
        results[name] = report(y, pred, conf)
    return results


def run_save_and_reload(args, device) -> dict:
    """Lesson 8: reload the CNN from its state_dict and classify one test image."""
    model = SmallCNN(dropout=0.3)
    model.load_state_dict(torch.load(args.out / "cnn_reg.pt", map_location="cpu"))
    model.eval()
    preprocess = transforms.Compose(
        [transforms.Resize((32, 32)), transforms.ToTensor(), transforms.Normalize(CIFAR_MEAN, CIFAR_STD)]
    )
    image, label = datasets.CIFAR10(args.data, train=False, download=True)[0]  # a PIL image
    with torch.no_grad():
        probs = torch.softmax(model(preprocess(image).unsqueeze(0)), dim=1)[0]
    top = probs.topk(3)
    return {
        "true": CLASSES[label],
        "top3": [{"class": CLASSES[i], "prob": round(float(p), 3)} for p, i in zip(top.values, top.indices)],
        "file_mb": round((args.out / "cnn_reg.pt").stat().st_size / 1e6, 2),
    }


def run_errors_figure(args, device) -> dict:
    """A grid of the CNN's most confident test errors (raw images, 4× upscaled), for lesson 7."""
    from torchvision.utils import save_image

    errors = json.loads((args.out / "results.json").read_text())["evaluate"]["cnn_reg"]
    raw = datasets.CIFAR10(args.data, train=False, download=True)
    to_tensor = transforms.Compose([transforms.Resize(128, interpolation=transforms.InterpolationMode.NEAREST),
                                    transforms.ToTensor()])
    images = torch.stack([to_tensor(raw[e["index"]][0]) for e in errors["most_confident_errors"]])
    path = args.out / "errores.png"
    save_image(images, path, nrow=6, padding=4, pad_value=1.0)
    return {"path": str(path)}


STEPS = {
    "data": lambda a, d: data_stats(a.data),
    "mlp": run_mlp,
    "cnn": run_cnn,
    "cnn_reg": run_cnn_regularized,
    "transfer": run_transfer,
    "evaluate": run_evaluate,
    "save": run_save_and_reload,
    "figure": run_errors_figure,
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--data", type=Path, required=True, help="where CIFAR-10 is (or goes)")
    parser.add_argument("--out", type=Path, required=True, help="checkpoints and results.json")
    parser.add_argument("--only", choices=list(STEPS), action="append")
    parser.add_argument("--quick", action="store_true", help="tiny subset, 1 epoch per phase")
    parser.add_argument("--size", type=int, default=160, help="input side for ResNet-18")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    args.epochs = (lambda n: 1) if args.quick else (lambda n: n)
    device = pick_device()
    results_file = args.out / "results.json"
    results = json.loads(results_file.read_text()) if results_file.exists() else {}
    results["device"] = str(device)
    results["torch"] = torch.__version__
    for name in args.only or list(STEPS):
        print(f"== {name}", flush=True)
        start = time.perf_counter()
        results[name] = STEPS[name](args, device)
        results[name + "_seconds"] = round(time.perf_counter() - start)
        results_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Resultados en {results_file}")


if __name__ == "__main__":
    main()
