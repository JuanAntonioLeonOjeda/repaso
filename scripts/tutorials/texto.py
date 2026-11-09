"""Runs the code of the "Texto" tutorial end to end (star rating of Spanish Amazon reviews), so
every number the lessons quote comes from a real run. It needs the environment in
scripts/tutorials/requirements.txt; it downloads the Spanish part of the Multilingual Amazon
Reviews Corpus (~50 MB, mteb/amazon_reviews_multi on Hugging Face) and BETO (~440 MB).

    python scripts/tutorials/texto.py --out /tmp/texto

Steps (each one a lesson): data statistics, TF-IDF + logistic regression baseline, a word
vocabulary, a bag of embeddings, a bidirectional LSTM, fine-tuning BETO, evaluation on test,
save and reload. `--only <step>` runs one step; `--quick` uses a tiny subset to try the script.
The output is a JSON file with every metric and training curve.
"""

import argparse
import json
import platform
import random
import re
import subprocess
import time
from collections import Counter
from pathlib import Path

import numpy as np
import torch
from huggingface_hub import hf_hub_download
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from torch import nn
from torch.nn.utils.rnn import pack_padded_sequence
from torch.utils.data import DataLoader

SEED = 42
STARS = ["1★", "2★", "3★", "4★", "5★"]
BETO = "dccuchile/bert-base-spanish-wwm-cased"
BETO_TRAIN_SIZE = 40_000  # fine-tuning on all 200.000 would take about two hours per epoch on MPS
MAX_TOKENS = 128

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


def load_split(split: str) -> tuple[list[str], np.ndarray]:
    """Texts (title + body, as the corpus stores them) and labels 0-4 (= 1-5 stars)."""
    path = hf_hub_download("mteb/amazon_reviews_multi", f"es/{split}.jsonl", repo_type="dataset")
    rows = [json.loads(line) for line in open(path, encoding="utf-8")]
    return [r["text"] for r in rows], np.array([r["label"] for r in rows])


def shuffled(texts: list[str], labels: np.ndarray, seed: int = SEED) -> tuple[list[str], np.ndarray]:
    order = np.random.default_rng(seed).permutation(len(labels))
    return [texts[i] for i in order], labels[order]


def load_data(quick: bool) -> dict:
    data = {split: load_split(split) for split in ("train", "validation", "test")}
    # The train file is sorted by label: any "first n" subset must come from a shuffled copy.
    data["train"] = shuffled(*data["train"])
    if quick:
        data = {k: tuple(x[:2000] for x in shuffled(t, y)) for k, (t, y) in data.items()}
    return data


def data_stats(data: dict) -> dict:
    texts, labels = data["train"]
    words = np.array([len(t.split()) for t in texts])
    raw_train_labels = load_split("train")[1]
    return {
        "first_rows_of_file": np.bincount(raw_train_labels[:40_000], minlength=5).tolist(),
        "sizes": {k: len(v[1]) for k, v in data.items()},
        "train_counts": np.bincount(labels, minlength=5).tolist(),
        "words_percentiles": {p: int(np.percentile(words, p)) for p in (10, 50, 90, 99)},
        "constant_3_mae_test": float(np.abs(data["test"][1] - 2).mean()),
    }


# ---------------------------------------------------------------------------------------------
# Metrics (lesson 7, used by every step)


def metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    cm = np.zeros((5, 5), dtype=int)
    np.add.at(cm, (y_true, y_pred), 1)
    diff = np.abs(y_true - y_pred)
    return {
        "accuracy": round(float((diff == 0).mean()), 4),
        "mae": round(float(diff.mean()), 4),
        "within_one": round(float((diff <= 1).mean()), 4),
        "recall": [round(float(r), 3) for r in cm.diagonal() / cm.sum(axis=1)],
        "confusion_matrix": cm.tolist(),
    }


# ---------------------------------------------------------------------------------------------
# Lesson 2: TF-IDF baseline


def fit_tfidf(train_texts, train_y, c: float) -> tuple[TfidfVectorizer, LogisticRegression]:
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    x = vectorizer.fit_transform(train_texts)  # learns vocabulary and idf on train only
    clf = LogisticRegression(C=c, max_iter=2000)
    clf.fit(x, train_y)
    return vectorizer, clf


def run_unigrams(args, data) -> dict:
    """The same baseline without bigrams, to measure what word pairs add."""
    (tr_x, tr_y), (va_x, va_y) = data["train"], data["validation"]
    best_c = json.loads((args.out / "results.json").read_text())["tfidf"]["best_C"]
    vec = TfidfVectorizer(ngram_range=(1, 1), min_df=2, sublinear_tf=True)
    clf = LogisticRegression(C=best_c, max_iter=2000).fit(vec.fit_transform(tr_x), tr_y)
    pred = clf.predict(vec.transform(va_x))
    return {"C": best_c, "features": len(vec.vocabulary_),
            **{k: v for k, v in metrics(va_y, pred).items() if k != "confusion_matrix"}}


def run_tfidf(args, data) -> dict:
    (tr_x, tr_y), (va_x, va_y) = data["train"], data["validation"]
    results = {}
    for n in (BETO_TRAIN_SIZE, len(tr_y)):
        for c in (0.3, 1.0, 3.0):
            start = time.perf_counter()
            vec, clf = fit_tfidf(tr_x[:n], tr_y[:n], c)
            pred = clf.predict(vec.transform(va_x))
            results[f"n{n}_C{c}"] = {
                "n": min(n, len(tr_y)),
                "C": c,
                "features": len(vec.vocabulary_),
                "seconds": round(time.perf_counter() - start, 1),
                **{k: v for k, v in metrics(va_y, pred).items() if k != "confusion_matrix"},
            }
            print(f"  n={n} C={c}: val acc {results[f'n{n}_C{c}']['accuracy']}", flush=True)
    best = max((r for r in results.values() if r["n"] == len(tr_y)), key=lambda r: r["accuracy"])
    vec, clf = fit_tfidf(tr_x, tr_y, best["C"])
    coefs = clf.coef_  # (5, features): one weight per class and n-gram
    names = np.array(vec.get_feature_names_out())
    top = {STARS[k]: names[np.argsort(-coefs[k])[:10]].tolist() for k in (0, 4)}
    torch.save({"vectorizer": vec, "clf": clf}, args.out / "tfidf.pt")
    return {"grid": results, "best_C": best["C"], "top_ngrams": top}


# ---------------------------------------------------------------------------------------------
# Lesson 3: a word vocabulary

TOKEN = re.compile(r"\w+|[^\w\s]")
PAD, UNK = 0, 1


def tokenize(text: str) -> list[str]:
    return TOKEN.findall(text.lower())


def build_vocab(texts, max_size: int = 30_000, min_freq: int = 2) -> dict[str, int]:
    counts = Counter(tok for t in texts for tok in tokenize(t))
    words = [w for w, c in counts.most_common(max_size - 2) if c >= min_freq]
    return {"<pad>": PAD, "<unk>": UNK, **{w: i + 2 for i, w in enumerate(words)}}


def encode(text: str, vocab: dict[str, int], max_len: int = MAX_TOKENS) -> list[int]:
    return [vocab.get(tok, UNK) for tok in tokenize(text)][:max_len] or [UNK]


def run_vocab(args, data) -> dict:
    vocab = build_vocab(data["train"][0])
    val_tokens = [tok for t in data["validation"][0] for tok in tokenize(t)]
    unk = sum(tok not in vocab for tok in val_tokens) / len(val_tokens)
    lengths = [len(tokenize(t)) for t in data["train"][0]]
    sample = "Llegó desconfigurado y el vendedor no contesta."
    return {
        "size": len(vocab),
        "val_unk_rate": round(unk, 4),
        "truncated_share": round(float(np.mean(np.array(lengths) > MAX_TOKENS)), 4),
        "sample_tokens": tokenize(sample),
        "sample_ids": encode(sample, vocab),
    }


# ---------------------------------------------------------------------------------------------
# Lessons 4-5: models on our own vocabulary


def collate_ids(batch):
    """Pads a batch of id lists to its longest one and returns ids, lengths and labels."""
    ids, labels = zip(*batch)
    lengths = torch.tensor([len(x) for x in ids])
    padded = torch.full((len(ids), int(lengths.max())), PAD, dtype=torch.long)
    for i, x in enumerate(ids):
        padded[i, : len(x)] = torch.tensor(x)
    return padded, lengths, torch.tensor(labels)


class BagOfEmbeddings(nn.Module):
    """Mean of the word embeddings (ignoring padding), then a linear layer."""

    def __init__(self, vocab_size: int, dim: int = 128) -> None:
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, dim, padding_idx=PAD)
        self.classifier = nn.Linear(dim, 5)

    def forward(self, ids: torch.Tensor, lengths: torch.Tensor) -> torch.Tensor:
        mask = (ids != PAD).unsqueeze(-1).float()  # (B, T, 1)
        summed = (self.embedding(ids) * mask).sum(dim=1)  # (B, dim)
        return self.classifier(summed / lengths.unsqueeze(1).to(summed))


class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size: int, dim: int = 128, hidden: int = 128, dropout: float = 0.3) -> None:
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, dim, padding_idx=PAD)
        self.lstm = nn.LSTM(dim, hidden, batch_first=True, bidirectional=True)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(2 * hidden, 5)

    def forward(self, ids: torch.Tensor, lengths: torch.Tensor) -> torch.Tensor:
        # Packing makes the LSTM stop at each text's real end instead of reading the padding.
        packed = pack_padded_sequence(self.embedding(ids), lengths.cpu(), batch_first=True, enforce_sorted=False)
        _, (h, _) = self.lstm(packed)  # h: (2, B, hidden), last state of each direction
        both = torch.cat([h[0], h[1]], dim=1)  # forward reads to the end, backward to the start
        return self.classifier(self.dropout(both))


def train_epoch(model, loader, optimizer, device, scheduler=None, clip: float | None = None) -> dict:
    model.train()
    loss_fn = nn.CrossEntropyLoss()
    total, correct, seen = 0.0, 0, 0
    for *inputs, y in loader:
        inputs = [t.to(device) for t in inputs]
        y = y.to(device)
        logits = model(*inputs)
        loss = loss_fn(logits, y)
        optimizer.zero_grad()
        loss.backward()
        if clip is not None:
            nn.utils.clip_grad_norm_(model.parameters(), clip)
        optimizer.step()
        if scheduler is not None:
            scheduler.step()
        total += loss.item() * len(y)
        correct += (logits.argmax(1) == y).sum().item()
        seen += len(y)
    return {"loss": total / seen, "acc": correct / seen}


@torch.no_grad()
def predict(model, loader, device) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    model.eval()
    ys, preds, probs = [], [], []
    for *inputs, y in loader:
        p = torch.softmax(model(*[t.to(device) for t in inputs]), dim=1).cpu()
        ys.append(y)
        preds.append(p.argmax(1))
        probs.append(p)
    return torch.cat(ys).numpy(), torch.cat(preds).numpy(), torch.cat(probs).numpy()


def fit_vocab_model(args, data, model, name: str, epochs: int, lr: float) -> dict:
    vocab = build_vocab(data["train"][0])
    enc = {k: [encode(t, vocab) for t in texts] for k, (texts, _) in data.items()}
    loaders = {
        k: DataLoader(list(zip(enc[k], data[k][1].tolist())), batch_size=128, shuffle=k == "train",
                      collate_fn=collate_ids)
        for k in data
    }
    device = args.device
    model = model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    history, best = [], -1.0
    for epoch in range(1, epochs + 1):
        start = time.perf_counter()
        train = train_epoch(model, loaders["train"], optimizer, device, clip=1.0)
        y, pred, _ = predict(model, loaders["validation"], device)
        val = {k: v for k, v in metrics(y, pred).items() if k in ("accuracy", "mae")}
        secs = round(time.perf_counter() - start, 1)
        history.append({"epoch": epoch, "train": train, "val": val, "seconds": secs})
        print(f"  {name} época {epoch}: train acc {train['acc']:.3f}  val acc {val['accuracy']:.3f}"
              f"  mae {val['mae']:.3f}  ({secs}s)", flush=True)
        if val["accuracy"] > best:
            best = val["accuracy"]
            torch.save(model.state_dict(), args.out / f"{name}.pt")
    model.load_state_dict(torch.load(args.out / f"{name}.pt", map_location=device))
    return {
        "params": sum(p.numel() for p in model.parameters()),
        "history": history,
        "best_epoch": max(history, key=lambda h: h["val"]["accuracy"])["epoch"],
        "best_val_acc": best,
    }


def run_bag(args, data) -> dict:
    seed_everything()
    vocab_size = len(build_vocab(data["train"][0]))
    return fit_vocab_model(args, data, BagOfEmbeddings(vocab_size), "bag", args.epochs(5), 1e-3)


def run_lstm(args, data) -> dict:
    seed_everything()
    vocab_size = len(build_vocab(data["train"][0]))
    return fit_vocab_model(args, data, BiLSTMClassifier(vocab_size), "lstm", args.epochs(5), 1e-3)


# ---------------------------------------------------------------------------------------------
# Lesson 6: fine-tuning BETO


class TokenizedReviews(torch.utils.data.Dataset):
    def __init__(self, texts, labels, tokenizer) -> None:
        self.enc = tokenizer(list(texts), truncation=True, max_length=MAX_TOKENS)
        self.labels = labels.tolist()

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, i):
        return {k: self.enc[k][i] for k in ("input_ids", "attention_mask")}, self.labels[i]


def beto_loader(texts, labels, tokenizer, shuffle: bool, batch_size: int = 32) -> DataLoader:
    def collate(batch):
        features, ys = zip(*batch)
        padded = tokenizer.pad(list(features), return_tensors="pt")  # pad to the batch's longest
        return padded["input_ids"], padded["attention_mask"], torch.tensor(ys)

    return DataLoader(TokenizedReviews(texts, labels, tokenizer), batch_size=batch_size,
                      shuffle=shuffle, collate_fn=collate)


class BetoClassifier(nn.Module):
    """Wraps the Hugging Face model so it takes (ids, mask) and returns logits, like ours."""

    def __init__(self, model) -> None:
        super().__init__()
        self.model = model

    def forward(self, ids: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        return self.model(input_ids=ids, attention_mask=mask).logits


def run_beto(args, data) -> dict:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer, get_linear_schedule_with_warmup

    seed_everything()
    tokenizer = AutoTokenizer.from_pretrained(BETO)
    hf_model = AutoModelForSequenceClassification.from_pretrained(
        BETO, num_labels=5, id2label=dict(enumerate(STARS)), label2id={s: i for i, s in enumerate(STARS)}
    )
    model = BetoClassifier(hf_model).to(args.device)
    n = BETO_TRAIN_SIZE if not args.quick else 500
    tr_x, tr_y = data["train"][0][:n], data["train"][1][:n]
    train_l = beto_loader(tr_x, tr_y, tokenizer, shuffle=True)
    val_l = beto_loader(*data["validation"], tokenizer, shuffle=False, batch_size=64)
    epochs = args.epochs(2)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    total_steps = epochs * len(train_l)
    scheduler = get_linear_schedule_with_warmup(optimizer, int(0.1 * total_steps), total_steps)
    history, best = [], -1.0
    for epoch in range(1, epochs + 1):
        start = time.perf_counter()
        train = train_epoch(model, train_l, optimizer, args.device, scheduler=scheduler, clip=1.0)
        y, pred, _ = predict(model, val_l, args.device)
        val = {k: v for k, v in metrics(y, pred).items() if k in ("accuracy", "mae")}
        secs = round(time.perf_counter() - start, 1)
        history.append({"epoch": epoch, "train": train, "val": val, "seconds": secs})
        print(f"  beto época {epoch}: train acc {train['acc']:.3f}  val acc {val['accuracy']:.3f}"
              f"  mae {val['mae']:.3f}  ({secs}s)", flush=True)
        if val["accuracy"] > best:
            best = val["accuracy"]
            hf_model.save_pretrained(args.out / "beto")
            tokenizer.save_pretrained(args.out / "beto")
    sample = "Llegó desconfigurado y el vendedor no contesta."
    return {
        "train_size": n,
        "params": sum(p.numel() for p in model.parameters()),
        "vocab_size": tokenizer.vocab_size,
        "sample_tokens": tokenizer.tokenize(sample),
        "total_steps": total_steps,
        "history": history,
        "best_epoch": max(history, key=lambda h: h["val"]["accuracy"])["epoch"],
        "best_val_acc": best,
    }


# ---------------------------------------------------------------------------------------------
# Lesson 7: evaluation on test


def run_evaluate(args, data) -> dict:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    te_x, te_y = data["test"]
    results = {}
    saved = torch.load(args.out / "tfidf.pt", weights_only=False)  # our own file: trusted
    results["tfidf"] = metrics(te_y, saved["clf"].predict(saved["vectorizer"].transform(te_x)))
    vocab = build_vocab(data["train"][0])
    loader = DataLoader([(encode(t, vocab), int(y)) for t, y in zip(te_x, te_y)], batch_size=256,
                        collate_fn=collate_ids)
    for name, model in (("bag", BagOfEmbeddings(len(vocab))), ("lstm", BiLSTMClassifier(len(vocab)))):
        model.load_state_dict(torch.load(args.out / f"{name}.pt", map_location=args.device))
        y, pred, _ = predict(model.to(args.device), loader, args.device)
        results[name] = metrics(y, pred)
    tokenizer = AutoTokenizer.from_pretrained(args.out / "beto")
    beto = BetoClassifier(AutoModelForSequenceClassification.from_pretrained(args.out / "beto"))
    y, pred, probs = predict(beto.to(args.device), beto_loader(te_x, te_y, tokenizer, False, 64), args.device)
    results["beto"] = metrics(y, pred)
    conf = probs.max(1)
    far = [i for i in np.argsort(-conf) if abs(int(y[i]) - int(pred[i])) >= 3][:8]
    results["beto_far_errors"] = [
        {"index": int(i), "true": STARS[y[i]], "pred": STARS[pred[i]], "conf": round(float(conf[i]), 3),
         "words": len(te_x[i].split())}
        for i in far
    ]
    return results


# ---------------------------------------------------------------------------------------------
# Lesson 8: save, reload and serve


def run_save(args, data) -> dict:
    from transformers import pipeline

    clf = pipeline("text-classification", model=str(args.out / "beto"), device="cpu")
    examples = [
        "Llegó en dos días y funciona perfectamente. Muy contento con la compra.",
        "Cumple, sin más. Por este precio no se puede pedir mucho.",
        "Se rompió a la semana y el vendedor no responde. No lo recomiendo.",
        "No está mal, pero esperaba bastante más por lo que cuesta.",
    ]
    out = [{"text": t, **clf(t, top_k=1)[0]} for t in examples]
    texts = data["test"][0][:256]
    start = time.perf_counter()
    for t in texts[:64]:
        clf(t)
    one_by_one = (time.perf_counter() - start) / 64
    start = time.perf_counter()
    clf(texts, batch_size=32)
    batched = (time.perf_counter() - start) / len(texts)
    size = sum(f.stat().st_size for f in (args.out / "beto").iterdir())
    return {
        "examples": out,
        "ms_per_text_one_by_one_cpu": round(one_by_one * 1000, 1),
        "ms_per_text_batched_cpu": round(batched * 1000, 1),
        "folder_mb": round(size / 1e6, 1),
    }


def run_neighbours(args, data) -> dict:
    """What the bag of embeddings learnt (lesson 4) and how long texts are for BETO (lesson 3)."""
    from transformers import AutoTokenizer

    vocab = build_vocab(data["train"][0])
    inverse = {i: w for w, i in vocab.items()}
    weights = torch.load(args.out / "bag.pt", map_location="cpu")["embedding.weight"].numpy()
    unit = weights / (np.linalg.norm(weights, axis=1, keepdims=True) + 1e-9)
    neighbours = {}
    for word in ("genial", "estupendo", "horrible", "regular"):
        sims = unit @ unit[vocab[word]]
        neighbours[word] = [inverse[i] for i in np.argsort(-sims)[1:9]]
    tokenizer = AutoTokenizer.from_pretrained(BETO)
    lengths = np.array([len(ids) for ids in tokenizer(data["train"][0], truncation=False)["input_ids"]])
    return {
        "neighbours": neighbours,
        "cos_genial_estupendo": round(float(unit[vocab["genial"]] @ unit[vocab["estupendo"]]), 3),
        "beto_median_tokens": float(np.median(lengths)),
        "beto_truncated_share": round(float(np.mean(lengths > MAX_TOKENS)), 4),
        "beto_over_512": int((lengths > 512).sum()),
    }


STEPS = {
    "data": lambda a, d: data_stats(d),
    "tfidf": run_tfidf,
    "unigrams": run_unigrams,
    "vocab": run_vocab,
    "bag": run_bag,
    "neighbours": run_neighbours,
    "lstm": run_lstm,
    "beto": run_beto,
    "evaluate": run_evaluate,
    "save": run_save,
}


def machine() -> str:
    try:
        chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True).stdout
    except OSError:
        chip = ""
    return chip.strip() or platform.processor() or platform.machine()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, required=True, help="checkpoints and results.json")
    parser.add_argument("--only", choices=list(STEPS), action="append")
    parser.add_argument("--quick", action="store_true", help="tiny subset, 1 epoch per model")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    args.epochs = (lambda n: 1) if args.quick else (lambda n: n)
    args.device = pick_device()
    data = load_data(args.quick)
    results_file = args.out / "results.json"
    results = json.loads(results_file.read_text()) if results_file.exists() else {}
    results.update({"device": str(args.device), "machine": machine(), "torch": torch.__version__})
    for name in args.only or list(STEPS):
        print(f"== {name}", flush=True)
        start = time.perf_counter()
        results[name] = STEPS[name](args, data)
        results[name + "_seconds"] = round(time.perf_counter() - start)
        results_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Resultados en {results_file}")


if __name__ == "__main__":
    main()
