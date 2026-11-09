"""Runs the code of the "IA generativa de imágenes" tutorial end to end (MNIST with PyTorch, then
SD-Turbo with diffusers), so every number and figure the lessons show comes from a real run.
It needs the environment in scripts/tutorials/requirements.txt; it downloads MNIST (~12 MB) and
SD-Turbo (~2,6 GB in fp16; using it means accepting the Stability AI Community License).

    python scripts/tutorials/generativa.py --data /tmp/mnist --out /tmp/generativa

Steps (each one a lesson): autoencoder, VAE, DCGAN, a class-conditional DDPM with
classifier-free guidance, evaluation (a classifier, FID on its features, nearest neighbours)
and SD-Turbo. `--only <step>` runs one step; `--quick` uses a small subset to try the script.
Figures (PNG) go to --out/figures; results.json holds every number.
"""

import argparse
import json
import math
import platform
import random
import subprocess
import time
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import torch  # noqa: E402
import torch.nn.functional as F  # noqa: E402
from scipy import linalg  # noqa: E402
from torch import nn  # noqa: E402
from torch.utils.data import DataLoader, Subset  # noqa: E402
from torchvision import datasets, transforms  # noqa: E402
from torchvision.utils import make_grid, save_image  # noqa: E402

SEED = 42


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


def mnist(args, train: bool, signed: bool):
    """MNIST in [0, 1] (autoencoders, BCE) or in [-1, 1] (GAN and diffusion, tanh / Gaussian noise)."""
    tfs = [transforms.ToTensor()] + ([transforms.Normalize((0.5,), (0.5,))] if signed else [])
    ds = datasets.MNIST(args.data, train=train, download=True, transform=transforms.Compose(tfs))
    return Subset(ds, range(2000)) if args.quick else ds


def loader(args, train: bool, signed: bool, batch_size: int = 128) -> DataLoader:
    return DataLoader(mnist(args, train, signed), batch_size=batch_size, shuffle=train,
                      num_workers=2, persistent_workers=True, drop_last=train)


def fig_path(args, name: str) -> Path:
    path = args.out / "figures"
    path.mkdir(exist_ok=True)
    return path / name


# ---------------------------------------------------------------------------------------------
# Lessons 2-3: autoencoder and VAE (2-D latent space, so it can be drawn)

LATENT = 2


class Encoder(nn.Module):
    def __init__(self, out: int) -> None:
        super().__init__()
        self.net = nn.Sequential(nn.Flatten(), nn.Linear(784, 512), nn.ReLU(), nn.Linear(512, 256),
                                 nn.ReLU(), nn.Linear(256, out))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class Decoder(nn.Module):
    """Latent vector -> 28x28 logits (BCEWithLogits; sigmoid gives the image)."""

    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(nn.Linear(LATENT, 256), nn.ReLU(), nn.Linear(256, 512), nn.ReLU(),
                                 nn.Linear(512, 784), nn.Unflatten(1, (1, 28, 28)))

    def forward(self, z: torch.Tensor) -> torch.Tensor:
        return self.net(z)


class Autoencoder(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.encoder, self.decoder = Encoder(LATENT), Decoder()

    def forward(self, x):
        z = self.encoder(x)
        return self.decoder(z), z


class VAE(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.encoder, self.decoder = Encoder(2 * LATENT), Decoder()

    def forward(self, x):
        mu, logvar = self.encoder(x).chunk(2, dim=1)
        z = mu + torch.exp(0.5 * logvar) * torch.randn_like(mu)  # reparameterisation trick
        return self.decoder(z), mu, logvar


def vae_loss(logits, x, mu, logvar):
    """Per-image sums, averaged over the batch: reconstruction + KL(q(z|x) || N(0, I))."""
    rec = F.binary_cross_entropy_with_logits(logits, x, reduction="sum") / len(x)
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp()) / len(x)
    return rec, kl


def train_autoencoder(args, model, kind: str, epochs: int) -> list[dict]:
    dev = args.device
    model.to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    history = []
    for epoch in range(1, epochs + 1):
        model.train()
        start, totals, n = time.perf_counter(), {"rec": 0.0, "kl": 0.0}, 0
        for x, _ in loader(args, True, False):
            x = x.to(dev)
            if kind == "vae":
                logits, mu, logvar = model(x)
                rec, kl = vae_loss(logits, x, mu, logvar)
                loss = rec + kl
            else:
                logits, _ = model(x)
                rec = F.binary_cross_entropy_with_logits(logits, x, reduction="sum") / len(x)
                kl, loss = torch.zeros(()), rec
            opt.zero_grad()
            loss.backward()
            opt.step()
            totals["rec"] += rec.item() * len(x)
            totals["kl"] += kl.item() * len(x)
            n += len(x)
        history.append({"epoch": epoch, "rec": totals["rec"] / n, "kl": totals["kl"] / n,
                        "seconds": round(time.perf_counter() - start, 1)})
        print(f"  {kind} época {epoch}: rec {history[-1]['rec']:.1f}  kl {history[-1]['kl']:.2f}", flush=True)
    return history


@torch.no_grad()
def test_latents(args, model, kind: str):
    model.eval()
    zs, ys, recs = [], [], []
    for x, y in loader(args, False, False, 512):
        x = x.to(args.device)
        if kind == "vae":
            mu, _ = model.encoder(x).chunk(2, dim=1)
            z = mu
        else:
            z = model.encoder(x)
        logits = model.decoder(z)
        recs.append(F.binary_cross_entropy_with_logits(logits, x, reduction="none").sum(dim=(1, 2, 3)).cpu())
        zs.append(z.cpu())
        ys.append(y)
    return torch.cat(zs).numpy(), torch.cat(ys).numpy(), float(torch.cat(recs).mean())


@torch.no_grad()
def decode(model, z: torch.Tensor) -> torch.Tensor:
    return torch.sigmoid(model.decoder(z))


def run_autoencoders(args) -> dict:
    out = {}
    models = {}
    for kind, model in (("ae", Autoencoder()), ("vae", VAE())):
        seed_everything()
        history = train_autoencoder(args, model, kind, args.epochs(20))
        z, y, test_rec = test_latents(args, model, kind)
        torch.save(model.state_dict(), args.out / f"{kind}.pt")
        models[kind] = (model, z, y)
        out[kind] = {
            "params": sum(p.numel() for p in model.parameters()),
            "history": history,
            "test_rec_bce": round(test_rec, 2),
            "latent_mean": np.round(z.mean(0), 2).tolist(),
            "latent_std": np.round(z.std(0), 2).tolist(),
            "latent_min": np.round(z.min(0), 1).tolist(),
            "latent_max": np.round(z.max(0), 1).tolist(),
        }
    # Figure: the two latent spaces, coloured by digit.
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.6))
    for ax, kind, title in zip(axes, ("ae", "vae"), ("Autoencoder", "VAE")):
        _, z, y = models[kind]
        sc = ax.scatter(z[:, 0], z[:, 1], c=y, cmap="tab10", s=2, alpha=0.6)
        ax.set_title(title)
        ax.set_xlabel("z₁")
        ax.set_ylabel("z₂")
    fig.colorbar(sc, ax=axes, ticks=range(10), label="dígito")
    fig.savefig(fig_path(args, "latentes.png"), dpi=110, bbox_inches="tight")
    plt.close(fig)
    # Figure: what each decoder draws from z ~ N(0, I).
    seed_everything()
    z = torch.randn(32, LATENT, device=args.device)
    for kind in ("ae", "vae"):
        save_image(decode(models[kind][0], z), fig_path(args, f"muestras-{kind}.png"), nrow=16, padding=2)
    # Figure: the VAE's map, decoding a grid of points in [-2.5, 2.5]^2.
    g = torch.linspace(-2.5, 2.5, 15)
    grid = torch.stack(torch.meshgrid(g, -g, indexing="xy"), dim=-1).reshape(-1, 2).to(args.device)
    save_image(decode(models["vae"][0], grid), fig_path(args, "mapa-vae.png"), nrow=15, padding=1)
    # How far N(0, I) samples land from the AE's real codes: share of samples outside its range.
    _, z_ae, _ = models["ae"]
    lo, hi = np.percentile(z_ae, 1, axis=0), np.percentile(z_ae, 99, axis=0)
    zs = np.random.default_rng(SEED).standard_normal((10_000, 2))
    out["ae_prior_inside_1_99"] = round(float(np.all((zs > lo) & (zs < hi), axis=1).mean()), 3)
    return out


# ---------------------------------------------------------------------------------------------
# Lesson 4: DCGAN

Z_DIM = 100


class Generator(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(Z_DIM, 128 * 7 * 7), nn.Unflatten(1, (128, 7, 7)), nn.BatchNorm2d(128), nn.ReLU(),
            nn.ConvTranspose2d(128, 64, 4, stride=2, padding=1), nn.BatchNorm2d(64), nn.ReLU(),  # 14x14
            nn.ConvTranspose2d(64, 1, 4, stride=2, padding=1), nn.Tanh(),  # 28x28 in [-1, 1]
        )

    def forward(self, z: torch.Tensor) -> torch.Tensor:
        return self.net(z)


class Discriminator(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 64, 4, stride=2, padding=1), nn.LeakyReLU(0.2),  # 14x14
            nn.Conv2d(64, 128, 4, stride=2, padding=1), nn.BatchNorm2d(128), nn.LeakyReLU(0.2),  # 7x7
            nn.Flatten(), nn.Linear(128 * 7 * 7, 1),  # one logit: "real"
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(1)


def run_gan(args) -> dict:
    seed_everything()
    dev = args.device
    G, D = Generator().to(dev), Discriminator().to(dev)
    opt_g = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))
    opt_d = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
    bce = nn.BCEWithLogitsLoss()
    fixed_z = torch.randn(64, Z_DIM, device=dev)  # the same noise every epoch, to watch progress
    history, snapshots = [], {}
    epochs = args.epochs(20)
    for epoch in range(1, epochs + 1):
        start, sums, n = time.perf_counter(), np.zeros(4), 0
        for real, _ in loader(args, True, True):
            real = real.to(dev)
            b = len(real)
            ones, zeros = torch.ones(b, device=dev), torch.zeros(b, device=dev)
            # 1) Discriminator: real -> 1, fake -> 0. detach(): this step does not train G.
            fake = G(torch.randn(b, Z_DIM, device=dev))
            d_real, d_fake = D(real), D(fake.detach())
            loss_d = bce(d_real, ones) + bce(d_fake, zeros)
            opt_d.zero_grad()
            loss_d.backward()
            opt_d.step()
            # 2) Generator: make D say "real" about the fakes (non-saturating loss).
            loss_g = bce(D(fake), ones)
            opt_g.zero_grad()
            loss_g.backward()
            opt_g.step()
            sums += np.array([loss_d.item(), loss_g.item(), torch.sigmoid(d_real).mean().item(),
                              torch.sigmoid(d_fake).mean().item()]) * b
            n += b
        ld, lg, dx, dgz = sums / n
        history.append({"epoch": epoch, "loss_d": ld, "loss_g": lg, "d_real": dx, "d_fake": dgz,
                        "seconds": round(time.perf_counter() - start, 1)})
        print(f"  gan época {epoch}: loss D {ld:.3f}  loss G {lg:.3f}  D(x) {dx:.2f}  D(G(z)) {dgz:.2f}", flush=True)
        if epoch in (1, 5, epochs):
            G.eval()
            with torch.no_grad():
                snapshots[epoch] = (G(fixed_z) + 1) / 2
            G.train()
    save_image(torch.cat([snapshots[e][:16] for e in sorted(snapshots)]), fig_path(args, "gan-epocas.png"),
               nrow=16, padding=2)
    torch.save(G.state_dict(), args.out / "gan.pt")
    return {
        "params_g": sum(p.numel() for p in G.parameters()),
        "params_d": sum(p.numel() for p in D.parameters()),
        "snapshot_epochs": sorted(snapshots),
        "history": history,
    }


# ---------------------------------------------------------------------------------------------
# Lessons 5-6: DDPM with class conditioning and classifier-free guidance

T = 1000
NULL = 10  # the "no label" class used for classifier-free guidance


def linear_schedule(t_steps: int = T) -> dict[str, torch.Tensor]:
    betas = torch.linspace(1e-4, 0.02, t_steps)
    alphas = 1 - betas
    alpha_bar = torch.cumprod(alphas, dim=0)
    return {"betas": betas, "alphas": alphas, "alpha_bar": alpha_bar}


def time_embedding(t: torch.Tensor, dim: int) -> torch.Tensor:
    """Sinusoidal embedding of the step, as in the transformer's positional encoding."""
    half = dim // 2
    freqs = torch.exp(-math.log(10_000) * torch.arange(half, device=t.device) / half)
    angles = t.float()[:, None] * freqs[None]
    return torch.cat([angles.sin(), angles.cos()], dim=1)


class ResBlock(nn.Module):
    def __init__(self, c_in: int, c_out: int, emb: int) -> None:
        super().__init__()
        self.conv1 = nn.Conv2d(c_in, c_out, 3, padding=1)
        self.conv2 = nn.Conv2d(c_out, c_out, 3, padding=1)
        self.norm1, self.norm2 = nn.GroupNorm(8, c_out), nn.GroupNorm(8, c_out)
        self.emb = nn.Linear(emb, c_out)  # step + class, added to every pixel of the feature maps
        self.skip = nn.Conv2d(c_in, c_out, 1) if c_in != c_out else nn.Identity()

    def forward(self, x, e):
        h = F.silu(self.norm1(self.conv1(x)))
        h = h + self.emb(e)[:, :, None, None]
        h = F.silu(self.norm2(self.conv2(h)))
        return h + self.skip(x)


class SmallUNet(nn.Module):
    """28 -> 14 -> 7 and back, with skip connections. Predicts the noise added to x_t."""

    def __init__(self, ch: int = 64, emb: int = 128) -> None:
        super().__init__()
        self.emb_dim = emb
        self.time_mlp = nn.Sequential(nn.Linear(emb, emb), nn.SiLU(), nn.Linear(emb, emb))
        self.label_emb = nn.Embedding(11, emb)  # digits 0-9 plus NULL
        self.inp = nn.Conv2d(1, ch, 3, padding=1)
        self.down1, self.down2 = ResBlock(ch, ch, emb), ResBlock(ch, 2 * ch, emb)
        self.mid = ResBlock(2 * ch, 2 * ch, emb)
        self.up2, self.up1 = ResBlock(4 * ch, ch, emb), ResBlock(2 * ch, ch, emb)
        self.pool = nn.AvgPool2d(2)
        self.upsample = nn.Upsample(scale_factor=2, mode="nearest")
        self.out = nn.Conv2d(ch, 1, 3, padding=1)

    def forward(self, x, t, y):
        e = self.time_mlp(time_embedding(t, self.emb_dim)) + self.label_emb(y)
        h0 = self.inp(x)
        h1 = self.down1(h0, e)  # 28x28
        h2 = self.down2(self.pool(h1), e)  # 14x14
        m = self.mid(self.pool(h2), e)  # 7x7
        u2 = self.up2(torch.cat([self.upsample(m), h2], 1), e)  # 14x14
        u1 = self.up1(torch.cat([self.upsample(u2), h1], 1), e)  # 28x28
        return self.out(u1)


def q_sample(x0, t, noise, alpha_bar):
    """x_t in one jump: sqrt(ᾱ_t)·x0 + sqrt(1 − ᾱ_t)·ε."""
    ab = alpha_bar[t][:, None, None, None]
    return ab.sqrt() * x0 + (1 - ab).sqrt() * noise


@torch.no_grad()
def sample(model, labels, sched, guidance: float, keep: tuple[int, ...] = ()):
    """DDPM ancestral sampling with classifier-free guidance; `keep` stores x_t at those steps."""
    model.eval()
    dev = labels.device
    x = torch.randn(len(labels), 1, 28, 28, device=dev)
    kept = {}
    null = torch.full_like(labels, NULL)
    for t in range(T - 1, -1, -1):
        tt = torch.full((len(labels),), t, device=dev)
        eps_c = model(x, tt, labels)
        eps = eps_c if guidance == 0 else (1 + guidance) * eps_c - guidance * model(x, tt, null)
        a, ab, b = sched["alphas"][t], sched["alpha_bar"][t], sched["betas"][t]
        mean = (x - b / (1 - ab).sqrt() * eps) / a.sqrt()
        x = mean + (b.sqrt() * torch.randn_like(x) if t > 0 else 0)
        if t in keep:
            kept[t] = x.clamp(-1, 1)
    return x.clamp(-1, 1), kept


def run_diffusion(args) -> dict:
    seed_everything()
    dev = args.device
    sched = {k: v.to(dev) for k, v in linear_schedule().items()}
    model = SmallUNet().to(dev)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-4)
    history = []
    for epoch in range(1, args.epochs(20) + 1):
        model.train()
        start, total, n = time.perf_counter(), 0.0, 0
        for x0, y in loader(args, True, True):
            x0, y = x0.to(dev), y.to(dev)
            y = torch.where(torch.rand(len(y), device=dev) < 0.1, torch.full_like(y, NULL), y)  # 10% no label
            t = torch.randint(0, T, (len(x0),), device=dev)
            noise = torch.randn_like(x0)
            loss = F.mse_loss(model(q_sample(x0, t, noise, sched["alpha_bar"]), t, y), noise)
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += loss.item() * len(x0)
            n += len(x0)
        history.append({"epoch": epoch, "loss": total / n, "seconds": round(time.perf_counter() - start, 1)})
        print(f"  difusión época {epoch}: loss {total / n:.4f}  ({history[-1]['seconds']}s)", flush=True)
    torch.save(model.state_dict(), args.out / "ddpm.pt")
    # Figure: the forward process on real digits.
    x0 = torch.stack([mnist(args, False, True)[i][0] for i in range(6)]).to(dev)
    steps = [0, 50, 100, 250, 500, 750, 999]
    noise = torch.randn_like(x0)
    rows = [q_sample(x0, torch.full((6,), s, device=dev), noise, sched["alpha_bar"]) for s in steps]
    save_image((torch.stack(rows, 1).reshape(-1, 1, 28, 28) + 1) / 2, fig_path(args, "ruido.png"), nrow=7, padding=2)
    # Figures: reverse process, unconditional and conditional samples, guidance sweep.
    seed_everything(1)
    labels = torch.arange(10, device=dev).repeat_interleave(1)
    keep = (999, 750, 500, 250, 100, 0)
    start = time.perf_counter()
    _, kept = sample(model, labels, sched, guidance=2.0, keep=keep)
    sample_seconds = time.perf_counter() - start
    save_image((torch.stack([kept[k] for k in keep], 1).reshape(-1, 1, 28, 28) + 1) / 2,
               fig_path(args, "denoising.png"), nrow=len(keep), padding=2)
    seed_everything(2)
    uncond, _ = sample(model, torch.full((64,), NULL, device=dev), sched, guidance=0)
    save_image((uncond + 1) / 2, fig_path(args, "difusion-sin-etiqueta.png"), nrow=16, padding=2)
    sweep = []
    for w in (0.0, 1.0, 3.0, 7.0):
        seed_everything(3)  # the same starting noise for every guidance value
        x, _ = sample(model, torch.arange(10, device=dev).repeat(2), sched, guidance=w)
        sweep.append((x + 1) / 2)
    save_image(torch.cat(sweep), fig_path(args, "guidance.png"), nrow=20, padding=2)
    return {
        "params": sum(p.numel() for p in model.parameters()),
        "history": history,
        "alpha_bar": {s: round(float(sched["alpha_bar"][s]), 5) for s in (0, 50, 100, 250, 500, 750, 999)},
        "seconds_to_sample_10": round(sample_seconds, 1),
    }


# ---------------------------------------------------------------------------------------------
# Lesson 7: evaluation


class SmallClassifier(nn.Module):
    """A small MNIST CNN: used to judge generated digits and as the feature extractor of FID."""

    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Flatten(), nn.Linear(64 * 7 * 7, 128), nn.ReLU(),
        )
        self.head = nn.Linear(128, 10)

    def forward(self, x):
        return self.head(self.features(x))


def frechet_distance(a: np.ndarray, b: np.ndarray) -> float:
    """FID: distance between two Gaussians fitted to two sets of feature vectors."""
    mu1, mu2 = a.mean(0), b.mean(0)
    s1, s2 = np.cov(a, rowvar=False), np.cov(b, rowvar=False)
    covmean = linalg.sqrtm(s1 @ s2).real
    return float(((mu1 - mu2) ** 2).sum() + np.trace(s1 + s2 - 2 * covmean))


@torch.no_grad()
def features_and_preds(clf, x: torch.Tensor, dev) -> tuple[np.ndarray, np.ndarray]:
    feats, preds = [], []
    for chunk in x.split(500):
        f = clf.features(chunk.to(dev))
        feats.append(f.cpu())
        preds.append(clf.head(f).argmax(1).cpu())
    return torch.cat(feats).numpy(), torch.cat(preds).numpy()


def run_evaluate(args) -> dict:
    dev = args.device
    seed_everything()
    clf = SmallClassifier().to(dev)
    opt = torch.optim.Adam(clf.parameters(), lr=1e-3)
    for _ in range(args.epochs(3)):
        clf.train()
        for x, y in loader(args, True, True):
            loss = F.cross_entropy(clf(x.to(dev)), y.to(dev))
            opt.zero_grad()
            loss.backward()
            opt.step()
    clf.eval()
    test = mnist(args, False, True)
    # 2.000 images per set: sampling a DDPM takes 1.000 network passes per image. The same n for
    # every model, since FID depends on it (fewer samples give a higher FID).
    n = 2000 if not args.quick else 500
    test_x = torch.stack([test[i][0] for i in range(n)])
    test_y = np.array([test[i][1] for i in range(n)])
    f_test, p_test = features_and_preds(clf, test_x, dev)
    train = mnist(args, True, True)
    train_x = torch.stack([train[i][0] for i in range(n)])
    f_train, _ = features_and_preds(clf, train_x, dev)
    results = {"classifier_test_acc": round(float((p_test == test_y).mean()), 4),
               "n": n, "fid": {"train_vs_test": round(frechet_distance(f_train, f_test), 2)}}

    # Generated sets of n images from every model.
    ae, vae, G = Autoencoder().to(dev), VAE().to(dev), Generator().to(dev)
    ae.load_state_dict(torch.load(args.out / "ae.pt", map_location=dev))
    vae.load_state_dict(torch.load(args.out / "vae.pt", map_location=dev))
    G.load_state_dict(torch.load(args.out / "gan.pt", map_location=dev))
    G.eval()
    unet = SmallUNet().to(dev)
    unet.load_state_dict(torch.load(args.out / "ddpm.pt", map_location=dev))
    sched = {k: v.to(dev) for k, v in linear_schedule().items()}
    seed_everything(4)
    with torch.no_grad():
        gen = {
            "ae": decode(ae, torch.randn(n, LATENT, device=dev)).cpu() * 2 - 1,
            "vae": decode(vae, torch.randn(n, LATENT, device=dev)).cpu() * 2 - 1,
            "gan": torch.cat([G(torch.randn(500, Z_DIM, device=dev)).cpu() for _ in range(n // 500)]),
        }
    asked = torch.arange(10).repeat(n // 10)
    for name, w, labels in (("ddpm_uncond", 0.0, torch.full((n,), NULL)),
                            ("ddpm_cfg0", 0.0, asked), ("ddpm_cfg3", 3.0, asked)):
        start = time.perf_counter()
        gen[name] = torch.cat([sample(unet, chunk.to(dev), sched, w)[0].cpu() for chunk in labels.split(1000)])
        results.setdefault("sampling_seconds", {})[name] = round(time.perf_counter() - start)
        print(f"  muestras {name}: {results['sampling_seconds'][name]} s", flush=True)
    for name, x in gen.items():
        f, p = features_and_preds(clf, x, dev)
        entry = {"fid": round(frechet_distance(f, f_test), 2),
                 "class_counts": np.bincount(p, minlength=10).tolist()}
        if name.startswith("ddpm_cfg"):
            entry["asked_digit_acc"] = round(float((p == asked.numpy()).mean()), 4)
        results[name] = entry
        print(f"  {name}: FID {entry['fid']}", flush=True)
    # Memorisation check: distance from generated digits to their nearest training image.
    train_flat = torch.stack([train[i][0] for i in range(len(train))]).reshape(len(train), -1).to(dev)

    def nearest(x):
        d = torch.cdist(x.reshape(len(x), -1).to(dev), train_flat)
        return d.min(1).values.cpu().numpy()

    results["nearest_train_l2"] = {
        "test_images": round(float(np.median(nearest(test_x[:500]))), 2),
        "ddpm_cfg3": round(float(np.median(nearest(gen["ddpm_cfg3"][:500]))), 2),
        "gan": round(float(np.median(nearest(gen["gan"][:500]))), 2),
    }
    return results


# ---------------------------------------------------------------------------------------------
# Lesson 8: SD-Turbo


def run_sdturbo(args) -> dict:
    from diffusers import AutoPipelineForText2Image
    from PIL import Image

    dev = args.device
    dtype = torch.float16 if dev.type in ("cuda", "mps") else torch.float32
    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=dtype, variant="fp16")
    pipe.to(dev)
    counts = {name: sum(p.numel() for p in getattr(pipe, name).parameters())
              for name in ("unet", "vae", "text_encoder")}
    prompts = [
        "a watercolor painting of a lighthouse on a cliff at sunset",
        "a photo of a red fox sitting in fresh snow, close-up",
        "an isometric illustration of a tiny library with bookshelves",
        "a bowl of ramen on a wooden table, studio photo",
    ]
    pipe(prompts[0], num_inference_steps=1, guidance_scale=0.0)  # warm-up (kernels, caches)
    images, timings = [], {}
    for steps in (1, 4):
        g = torch.Generator("cpu").manual_seed(SEED)
        start = time.perf_counter()
        out = pipe(prompts, num_inference_steps=steps, guidance_scale=0.0, generator=g).images
        timings[steps] = round((time.perf_counter() - start) / len(prompts), 2)
        images.append(out)
    for steps, out in zip((1, 4), images):
        w, h = out[0].size
        canvas = np.concatenate([np.asarray(im.resize((256, 256))) for im in out], axis=1)
        # Photos: JPEG keeps the lesson page light (a PNG of this strip is over 0,5 MB).
        Image.fromarray(canvas).save(fig_path(args, f"sd-turbo-{steps}-paso{'s' if steps > 1 else ''}.jpg"), quality=85)
    return {"params": counts, "image_size": [w, h], "seconds_per_image": timings, "prompts": prompts}


def run_memorization(args) -> dict:
    """Nearest training image for 500 samples of each model: median, 1st percentile and minimum.
    A model that copies shows up in the low tail, not in the median."""
    dev = args.device
    train = mnist(args, True, True)
    train_flat = torch.stack([train[i][0] for i in range(len(train))]).reshape(len(train), -1).to(dev)
    test = mnist(args, False, True)
    n = 500 if not args.quick else 100
    G = Generator().to(dev)
    G.load_state_dict(torch.load(args.out / "gan.pt", map_location=dev))
    G.eval()
    unet = SmallUNet().to(dev)
    unet.load_state_dict(torch.load(args.out / "ddpm.pt", map_location=dev))
    sched = {k: v.to(dev) for k, v in linear_schedule().items()}
    asked = torch.arange(10, device=dev).repeat(n // 10)
    seed_everything(5)
    with torch.no_grad():
        sets = {"test": torch.stack([test[i][0] for i in range(n)]), "gan": G(torch.randn(n, Z_DIM, device=dev))}
    for name, w in (("ddpm_cfg0", 0.0), ("ddpm_cfg3", 3.0)):
        sets[name] = sample(unet, asked, sched, w)[0]
        print(f"  muestras {name} listas", flush=True)
    out = {}
    for name, x in sets.items():
        d = torch.cdist(x.reshape(len(x), -1).to(dev), train_flat).min(1).values.cpu().numpy()
        out[name] = {"median": round(float(np.median(d)), 2), "p1": round(float(np.percentile(d, 1)), 2),
                     "min": round(float(d.min()), 2)}
        print(f"  {name}: {out[name]}", flush=True)
    return out


STEPS = {
    "autoencoders": run_autoencoders,
    "gan": run_gan,
    "diffusion": run_diffusion,
    "evaluate": run_evaluate,
    "memorization": run_memorization,
    "sdturbo": run_sdturbo,
}


def machine() -> str:
    try:
        chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True).stdout
    except OSError:
        chip = ""
    return chip.strip() or platform.processor() or platform.machine()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--data", type=Path, required=True, help="where MNIST is (or goes)")
    parser.add_argument("--out", type=Path, required=True, help="checkpoints, figures and results.json")
    parser.add_argument("--only", choices=list(STEPS), action="append")
    parser.add_argument("--quick", action="store_true", help="small subset, 1 epoch per model")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    args.epochs = (lambda n: 1) if args.quick else (lambda n: n)
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
