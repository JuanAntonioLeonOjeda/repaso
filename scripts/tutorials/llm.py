"""Runs the code of the "Crea tu LLM" tutorial end to end: a byte-level BPE tokenizer and a small
GPT trained from scratch on Don Quijote, sampling, LoRA written by hand to adapt it to Lazarillo
de Tormes, and a base vs instruct comparison with Qwen2.5-0.5B. Every number the lessons quote
comes from a real run. It needs the environment in scripts/tutorials/requirements.txt; it
downloads both books from Project Gutenberg (public domain, ~2,4 MB) and Qwen2.5-0.5B base and
instruct (~1 GB each, Apache 2.0).

    python scripts/tutorials/llm.py --out /tmp/llm

Steps: data, tokenizer, bigram, gpt, generate, lora, instruct. `--only <step>` runs one step;
`--quick` trains for a few steps to try the script. results.json holds every number.
"""

import argparse
import json
import math
import platform
import random
import subprocess
import time
import urllib.request
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from torch import nn

SEED = 42
BOOKS = {"quijote": 2000, "lazarillo": 320}  # Project Gutenberg ids
VOCAB = 2048
CONTEXT = 256


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


# ---------------------------------------------------------------------------------------------
# Lesson 1: data


def book(args, name: str) -> str:
    """The book's text without Project Gutenberg's header and licence footer."""
    path = args.out / f"{name}.txt"
    if not path.exists():
        url = f"https://www.gutenberg.org/cache/epub/{BOOKS[name]}/pg{BOOKS[name]}.txt"
        urllib.request.urlretrieve(url, path)
    raw = path.read_text(encoding="utf-8")
    start = raw.index("***", raw.index("*** START OF")) + 3
    start = raw.index("\n", start) + 1
    end = raw.index("*** END OF")
    return raw[start:end].strip().replace("\r\n", "\n")


def split(text: str, val: float = 0.1) -> tuple[str, str]:
    """Train on the first 90% of the book and validate on the last 10%: no shuffling of a text,
    or the validation would share sentences with training."""
    cut = int(len(text) * (1 - val))
    return text[:cut], text[cut:]


def run_data(args) -> dict:
    out = {}
    for name in BOOKS:
        text = book(args, name)
        train, val = split(text)
        out[name] = {"chars": len(text), "words": len(text.split()), "train_chars": len(train),
                     "val_chars": len(val), "distinct_chars": len(set(text)), "opening": text[:300]}
    return out


# ---------------------------------------------------------------------------------------------
# Lesson 2: tokenizer (byte-level BPE, like GPT-2's)


def train_tokenizer(args):
    from tokenizers import ByteLevelBPETokenizer

    train, _ = split(book(args, "quijote"))
    tok = ByteLevelBPETokenizer()
    tok.train_from_iterator([train], vocab_size=VOCAB, min_frequency=2, special_tokens=["<|endoftext|>"])
    tok.save(str(args.out / "bpe.json"))
    return tok


def load_tokenizer(args):
    from tokenizers import Tokenizer

    return Tokenizer.from_file(str(args.out / "bpe.json"))


def readable(token: str) -> str:
    """Byte-level BPE shows a leading space as 'Ġ' and a newline as 'Ċ'; decode them for display."""
    return bytes([_BYTE_DECODER[c] for c in token]).decode("utf-8", errors="replace")


def _bytes_to_unicode() -> dict[int, str]:
    bs = list(range(ord("!"), ord("~") + 1)) + list(range(ord("¡"), ord("¬") + 1)) + list(range(ord("®"), ord("ÿ") + 1))
    cs, n = bs[:], 0
    for b in range(256):
        if b not in bs:
            bs.append(b)
            cs.append(256 + n)
            n += 1
    return dict(zip(bs, (chr(c) for c in cs)))


_BYTE_DECODER = {v: k for k, v in _bytes_to_unicode().items()}


def run_tokenizer(args) -> dict:
    tok = train_tokenizer(args)
    train, val = split(book(args, "quijote"))
    ids_train, ids_val = tok.encode(train).ids, tok.encode(val).ids
    sample = "En un lugar de la Mancha, de cuyo nombre no quiero acordarme"
    enc = tok.encode(sample)
    merges = json.loads((args.out / "bpe.json").read_text())["model"]["merges"]
    first = [m if isinstance(m, str) else " ".join(m) for m in merges[:12]]
    return {
        "vocab_size": tok.get_vocab_size(),
        "train_tokens": len(ids_train),
        "val_tokens": len(ids_val),
        "chars_per_token": round(len(train) / len(ids_train), 2),
        "sample": sample,
        "sample_tokens": [readable(t) for t in enc.tokens],
        "sample_ids": enc.ids,
        "first_merges": [" + ".join(readable(p) for p in m.split(" ")) for m in first],
        "rare_word_tokens": [readable(t) for t in tok.encode(" desaguisado").tokens],
    }


def token_tensors(args, name: str = "quijote") -> tuple[torch.Tensor, torch.Tensor]:
    tok = load_tokenizer(args)
    train, val = split(book(args, name))
    return (torch.tensor(tok.encode(train).ids, dtype=torch.long),
            torch.tensor(tok.encode(val).ids, dtype=torch.long))


# ---------------------------------------------------------------------------------------------
# Lesson 3: bigram model


def run_bigram(args) -> dict:
    train, val = token_tensors(args)
    counts = torch.zeros(VOCAB, VOCAB)
    counts.index_put_((train[:-1], train[1:]), torch.ones(len(train) - 1), accumulate=True)
    out = {"uniform_loss": round(math.log(VOCAB), 4)}
    unigram = torch.bincount(train, minlength=VOCAB).float() + 1
    unigram /= unigram.sum()
    out["unigram_val_loss"] = round(float(-unigram[val].log().mean()), 4)
    for smoothing in (0.01, 0.1, 1.0):
        probs = (counts + smoothing) / (counts + smoothing).sum(dim=1, keepdim=True)
        loss = float(-probs[val[:-1], val[1:]].log().mean())
        out[f"bigram_val_loss_add{smoothing}"] = round(loss, 4)
    best = min((0.01, 0.1, 1.0), key=lambda s: out[f"bigram_val_loss_add{s}"])
    probs = (counts + best) / (counts + best).sum(dim=1, keepdim=True)
    out["best_smoothing"] = best
    out["bigram_train_loss"] = round(float(-probs[train[:-1], train[1:]].log().mean()), 4)
    out["seen_pairs"] = int((counts > 0).sum())
    g = torch.Generator().manual_seed(SEED)
    tok = load_tokenizer(args)
    idx = [tok.encode("En").ids[0]]
    for _ in range(60):
        idx.append(int(torch.multinomial(probs[idx[-1]], 1, generator=g)))
    out["sample"] = tok.decode(idx)
    return out


# ---------------------------------------------------------------------------------------------
# Lessons 4-5: the transformer


class CausalSelfAttention(nn.Module):
    def __init__(self, d: int, heads: int, dropout: float) -> None:
        super().__init__()
        self.heads = heads
        self.qkv = nn.Linear(d, 3 * d)  # queries, keys and values in one matrix
        self.proj = nn.Linear(d, d)
        self.dropout = dropout

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, t, d = x.shape
        q, k, v = self.qkv(x).split(d, dim=2)
        # (B, T, d) -> (B, heads, T, d / heads): each head attends in its own subspace
        q, k, v = (z.view(b, t, self.heads, d // self.heads).transpose(1, 2) for z in (q, k, v))
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True,
                                           dropout_p=self.dropout if self.training else 0.0)
        return self.proj(y.transpose(1, 2).reshape(b, t, d))


class Block(nn.Module):
    def __init__(self, d: int, heads: int, dropout: float) -> None:
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = CausalSelfAttention(d, heads, dropout)
        self.mlp = nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Linear(4 * d, d), nn.Dropout(dropout))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.ln1(x))  # pre-norm and residual connections, as in GPT-2
        return x + self.mlp(self.ln2(x))


class GPT(nn.Module):
    def __init__(self, layers: int = 6, d: int = 384, heads: int = 6, dropout: float = 0.2) -> None:
        super().__init__()
        self.tok_emb = nn.Embedding(VOCAB, d)
        self.pos_emb = nn.Embedding(CONTEXT, d)  # learnt positions, as in GPT-2
        self.drop = nn.Dropout(dropout)
        self.blocks = nn.ModuleList(Block(d, heads, dropout) for _ in range(layers))
        self.ln_f = nn.LayerNorm(d)
        self.head = nn.Linear(d, VOCAB, bias=False)
        self.head.weight = self.tok_emb.weight  # weight tying: the same matrix reads and writes tokens
        self.apply(self._init_weights)

    @staticmethod
    def _init_weights(module: nn.Module) -> None:
        # GPT-2's initialisation: small weights (std 0,02). With PyTorch's default (std 1) for the
        # embedding, which is also the output layer here, the first logits would be huge and the
        # initial loss far above ln(VOCAB).
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
        if isinstance(module, nn.Linear) and module.bias is not None:
            nn.init.zeros_(module.bias)

    def forward(self, idx: torch.Tensor) -> torch.Tensor:
        pos = torch.arange(idx.shape[1], device=idx.device)
        x = self.drop(self.tok_emb(idx) + self.pos_emb(pos))
        for block in self.blocks:
            x = block(x)
        return self.head(self.ln_f(x))  # (B, T, VOCAB): a next-token distribution at every position


def get_batch(data: torch.Tensor, batch: int, g: torch.Generator) -> tuple[torch.Tensor, torch.Tensor]:
    """Random windows of CONTEXT tokens; the target is the same window shifted by one."""
    starts = torch.randint(len(data) - CONTEXT - 1, (batch,), generator=g)
    x = torch.stack([data[s:s + CONTEXT] for s in starts])
    y = torch.stack([data[s + 1:s + CONTEXT + 1] for s in starts])
    return x, y


@torch.no_grad()
def estimate_loss(model, data, dev, batches: int = 40) -> float:
    model.eval()
    g = torch.Generator().manual_seed(123)  # the same windows every time: comparable numbers
    losses = []
    for _ in range(batches):
        x, y = get_batch(data, 32, g)
        logits = model(x.to(dev))
        losses.append(F.cross_entropy(logits.reshape(-1, VOCAB), y.to(dev).reshape(-1)).item())
    model.train()
    return float(np.mean(losses))


def lr_at(step: int, total: int, peak: float, warmup: int) -> float:
    if step < warmup:
        return peak * (step + 1) / warmup
    progress = (step - warmup) / max(1, total - warmup)
    return peak * (0.1 + 0.9 * 0.5 * (1 + math.cos(math.pi * progress)))  # cosine down to 10%


def train_gpt(model, train, val, dev, *, steps, peak_lr, ckpt, params=None, eval_every=250, label="gpt"):
    model.to(dev).train()
    opt = torch.optim.AdamW(params if params is not None else model.parameters(), lr=peak_lr,
                            betas=(0.9, 0.95), weight_decay=0.1)
    g = torch.Generator().manual_seed(SEED)
    history, best, start = [], float("inf"), time.perf_counter()
    for step in range(steps + 1):
        if step % eval_every == 0 or step == steps:
            tr, va = estimate_loss(model, train, dev), estimate_loss(model, val, dev)
            history.append({"step": step, "train": round(tr, 4), "val": round(va, 4),
                            "seconds": round(time.perf_counter() - start)})
            print(f"  {label} paso {step}: train {tr:.3f}  val {va:.3f}  ({history[-1]['seconds']}s)", flush=True)
            if va < best:
                best = va
                torch.save(model.state_dict(), ckpt)
        if step == steps:
            break
        for group in opt.param_groups:
            group["lr"] = lr_at(step, steps, peak_lr, warmup=min(200, steps // 10))
        x, y = get_batch(train, 32, g)
        loss = F.cross_entropy(model(x.to(dev)).reshape(-1, VOCAB), y.to(dev).reshape(-1))
        opt.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
    model.load_state_dict(torch.load(ckpt, map_location=dev))
    return {"history": history, "best_val": round(best, 4)}


def count(model) -> int:
    return sum(p.numel() for p in model.parameters())


def run_gpt(args) -> dict:
    train, val = token_tensors(args)
    out = {}
    for name, cfg, steps in (("small", dict(layers=2, d=128, heads=4), args.steps(3000)),
                             ("gpt", dict(layers=6, d=384, heads=6), args.steps(3000))):
        seed_everything()
        model = GPT(**cfg)
        res = train_gpt(model, train, val, args.device, steps=steps, peak_lr=1e-3 if name == "small" else 6e-4,
                        ckpt=args.out / f"{name}.pt", label=name)
        out[name] = {"config": cfg, "params": count(model), "steps": steps,
                     "tokens_seen": steps * 32 * CONTEXT, **res}
    return out


# ---------------------------------------------------------------------------------------------
# Lesson 7: generating text


@torch.no_grad()
def generate(model, idx: torch.Tensor, n: int, temperature: float = 1.0, top_k: int | None = None,
             top_p: float | None = None, g: torch.Generator | None = None) -> torch.Tensor:
    model.eval()
    for _ in range(n):
        logits = model(idx[:, -CONTEXT:])[:, -1, :]  # only the last position predicts what comes next
        if temperature == 0:
            nxt = logits.argmax(-1, keepdim=True)  # greedy
        else:
            logits = logits / temperature
            if top_k is not None:
                kth = torch.topk(logits, top_k).values[:, -1, None]
                logits = logits.masked_fill(logits < kth, float("-inf"))
            probs = F.softmax(logits, dim=-1)
            if top_p is not None:
                sorted_p, order = probs.sort(descending=True)
                drop = sorted_p.cumsum(-1) - sorted_p > top_p  # keep a token while the mass before it is ≤ top_p
                sorted_p[drop] = 0
                probs = torch.zeros_like(probs).scatter(-1, order, sorted_p)
                probs /= probs.sum(-1, keepdim=True)
            nxt = torch.multinomial(probs.cpu(), 1, generator=g).to(idx.device)
        idx = torch.cat([idx, nxt], dim=1)
    return idx


def distinct_2(ids: list[int]) -> float:
    """Share of distinct consecutive token pairs: low values mean loops and repetition."""
    pairs = list(zip(ids, ids[1:]))
    return len(set(pairs)) / max(1, len(pairs))


def run_generate(args) -> dict:
    dev = args.device
    tok = load_tokenizer(args)
    model = GPT()
    model.load_state_dict(torch.load(args.out / "gpt.pt", map_location=dev))
    model.to(dev)
    prompt = "En un lugar de la Mancha"
    idx = torch.tensor([tok.encode(prompt).ids], device=dev)
    out = {"prompt": prompt, "samples": {}}
    settings = {"greedy": dict(temperature=0), "t0.7_k50": dict(temperature=0.7, top_k=50),
                "t1.0": dict(temperature=1.0), "t1.5": dict(temperature=1.5),
                "t1.0_p0.9": dict(temperature=1.0, top_p=0.9)}
    for name, kw in settings.items():
        g = torch.Generator().manual_seed(SEED)
        ids = generate(model, idx, 80, g=g, **kw)[0].tolist()
        out["samples"][name] = {"text": tok.decode(ids), "distinct_2": round(distinct_2(ids[len(idx[0]):]), 3)}
    # The real next-token distribution after a prompt, for the sampling simulation.
    p2 = "Y diciendo esto, don Quijote"
    with torch.no_grad():
        logits = model(torch.tensor([tok.encode(p2).ids], device=dev))[0, -1].cpu()
    top = torch.topk(logits, 30)
    out["next_token"] = {"prompt": p2,
                         "tokens": [readable(tok.id_to_token(int(i))) for i in top.indices],
                         "logits": [round(float(v), 3) for v in top.values]}
    # Speed of generation (no KV cache: the whole window is recomputed at every token).
    start = time.perf_counter()
    generate(model, idx, 200, temperature=1.0, g=torch.Generator().manual_seed(1))
    out["tokens_per_second"] = round(200 / (time.perf_counter() - start), 1)
    return out


# ---------------------------------------------------------------------------------------------
# Lesson 8: LoRA by hand, and instruction tuning with a real model


class LoRALinear(nn.Module):
    """W x + (alpha / r) · B A x, with W frozen and only A (r × in) and B (out × r) trained."""

    def __init__(self, base: nn.Linear, r: int = 8, alpha: float = 16) -> None:
        super().__init__()
        self.base = base
        for p in self.base.parameters():
            p.requires_grad = False
        self.A = nn.Parameter(torch.randn(r, base.in_features) / math.sqrt(base.in_features))
        self.B = nn.Parameter(torch.zeros(base.out_features, r))  # starts at 0: no change at step 0
        self.scale = alpha / r

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base(x) + self.scale * (x @ self.A.T) @ self.B.T


def add_lora(model: GPT, r: int = 8) -> list[nn.Parameter]:
    for p in model.parameters():
        p.requires_grad = False
    params = []
    for block in model.blocks:
        block.attn.qkv = LoRALinear(block.attn.qkv, r=r)
        params += [block.attn.qkv.A, block.attn.qkv.B]
    return params


def run_lora(args) -> dict:
    dev = args.device
    tok = load_tokenizer(args)
    train, val = token_tensors(args, "lazarillo")
    out = {"lazarillo_train_tokens": len(train), "lazarillo_val_tokens": len(val)}
    base = GPT()
    base.load_state_dict(torch.load(args.out / "gpt.pt", map_location=dev))
    base.to(dev)
    out["zero_shot_val"] = round(estimate_loss(base, val, dev), 4)
    prompt = torch.tensor([tok.encode("Pues sepa vuestra merced").ids], device=dev)
    steps = args.steps(600)
    for name in ("full", "lora"):
        seed_everything()
        model = GPT()
        model.load_state_dict(torch.load(args.out / "gpt.pt", map_location=dev))
        params = add_lora(model) if name == "lora" else None
        trainable = sum(p.numel() for p in (params or model.parameters()))
        res = train_gpt(model, train, val, dev, steps=steps, peak_lr=1e-3 if name == "lora" else 1e-4,
                        ckpt=args.out / f"lazarillo_{name}.pt", params=params, eval_every=50, label=name)
        g = torch.Generator().manual_seed(SEED)
        sample = tok.decode(generate(model, prompt, 70, temperature=0.8, top_k=50, g=g)[0].tolist())
        lora_mb = trainable * 4 / 1e6
        out[name] = {"trainable": trainable, "trainable_mb_fp32": round(lora_mb, 2), "sample": sample, **res}
    g = torch.Generator().manual_seed(SEED)
    out["base_sample"] = tok.decode(generate(base, prompt, 70, temperature=0.8, top_k=50, g=g)[0].tolist())
    out["total_params"] = count(base)
    return out


def run_instruct(args) -> dict:
    from transformers import AutoModelForCausalLM, AutoTokenizer

    dev = args.device
    question = "¿Por qué el cielo es azul? Responde en dos frases."
    out = {"question": question}
    for name in ("Qwen/Qwen2.5-0.5B", "Qwen/Qwen2.5-0.5B-Instruct"):
        tok = AutoTokenizer.from_pretrained(name)
        model = AutoModelForCausalLM.from_pretrained(name, dtype=torch.float16).to(dev)
        if name.endswith("Instruct"):
            messages = [{"role": "user", "content": question}]
            text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            out["chat_template_text"] = text
        else:
            text = question
        ids = tok(text, return_tensors="pt").to(dev)
        start = time.perf_counter()
        gen = model.generate(**ids, max_new_tokens=80, do_sample=False)
        seconds = time.perf_counter() - start
        new = gen[0, ids["input_ids"].shape[1]:]
        out[name.split("/")[1]] = {"answer": tok.decode(new, skip_special_tokens=True),
                                   "params": count(model), "new_tokens": int(len(new)),
                                   "tokens_per_second": round(len(new) / seconds, 1)}
        print(f"  {name}: {out[name.split('/')[1]]['answer'][:120]!r}", flush=True)
    return out


def run_examples(args) -> dict:
    """Next-token distributions of the trained GPT for the prompts the lessons quote."""
    dev = args.device
    tok = load_tokenizer(args)
    model = GPT()
    model.load_state_dict(torch.load(args.out / "gpt.pt", map_location=dev))
    model.to(dev).eval()
    out = {}
    for prompt in ("En un lugar de la", "Sancho Panza respondió que"):
        with torch.no_grad():
            probs = F.softmax(model(torch.tensor([tok.encode(prompt).ids], device=dev))[0, -1], dim=-1).cpu()
        top = torch.topk(probs, 5)
        out[prompt] = [{"token": readable(tok.id_to_token(int(i))), "p": round(float(v), 4)}
                       for v, i in zip(top.values, top.indices)]
    return out


STEPS = {
    "data": run_data,
    "tokenizer": run_tokenizer,
    "bigram": run_bigram,
    "gpt": run_gpt,
    "generate": run_generate,
    "examples": run_examples,
    "lora": run_lora,
    "instruct": run_instruct,
}


def machine() -> str:
    try:
        chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True).stdout
    except OSError:
        chip = ""
    return chip.strip() or platform.processor() or platform.machine()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, required=True, help="books, tokenizer, checkpoints, results.json")
    parser.add_argument("--only", choices=list(STEPS), action="append")
    parser.add_argument("--quick", action="store_true", help="a few training steps per model")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    args.steps = (lambda n: 20) if args.quick else (lambda n: n)
    args.device = pick_device()
    results_file = args.out / "results.json"
    results = json.loads(results_file.read_text()) if results_file.exists() else {}
    results.update({"device": str(args.device), "machine": machine(), "torch": torch.__version__})
    for name in args.only or list(STEPS):
        print(f"== {name}", flush=True)
        start = time.perf_counter()
        results[name] = STEPS[name](args)
        results[name + "_seconds"] = round(time.perf_counter() - start)
        results_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Resultados en {results_file}")


if __name__ == "__main__":
    main()
