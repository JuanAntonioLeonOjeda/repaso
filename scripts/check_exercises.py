"""Runs every <CodeExercise> solution (plus its check) and every <RunCode> example found in
the lessons, so a broken exercise is caught before it reaches the browser.

It needs a Python with the same packages Pyodide ships (numpy, pandas, scikit-learn,
scipy, matplotlib); see "Checking the exercises" in the README.

    python scripts/check_exercises.py [path-filter]
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content"
DATASETS = ROOT / "public" / "datasets"

# A JSX prop holding a template literal: name={`...`}
PROP = r"{name}=\{{`(.*?)`\}}"

# Pyodide runs code with top-level `await` allowed (the FastAPI exercises call the app with
# `await client.get(...)`); CPython needs the compile flag and an event loop for that.
RUNNER = """
import ast, asyncio, inspect, sys
with open(sys.argv[1]) as f:
    source = f.read()
code = compile(source, "<exec>", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
result = eval(code, {"__name__": "__main__"})
if inspect.iscoroutine(result):
    asyncio.run(result)
"""


def template_literal(raw: str) -> str:
    """What JavaScript makes of a template literal: escapes resolved, then dedented."""
    text = raw.replace("\\`", "`").replace("\\${", "${").replace("\\\\", "\\")
    return textwrap.dedent(text).strip("\n")


def blocks(source: str, tag: str) -> list[str]:
    return re.findall(rf"<{tag}\b(.*?)(?:/>|>)\s*(?=\S)", source, flags=re.S)


def extract(block: str, name: str) -> str | None:
    match = re.search(PROP.format(name=name), block, flags=re.S)
    return template_literal(match.group(1)) if match else None


def files_of(block: str) -> list[str]:
    match = re.search(r"files=\{\[(.*?)\]\}", block, flags=re.S)
    return re.findall(r'"([^"]+)"', match.group(1)) if match else []


def run(code: str, files: list[str]) -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        for name in files:
            shutil.copy(DATASETS / name, tmp)
        script = Path(tmp) / "__exercise__.py"
        script.write_text(code)
        env = {**os.environ, "MPLBACKEND": "Agg", "PYTHONHASHSEED": "0"}
        proc = subprocess.run(
            [sys.executable, "-I", "-c", RUNNER, str(script)],
            cwd=tmp,
            capture_output=True,
            text=True,
            timeout=300,
            env=env,
        )
        return proc.returncode == 0, (proc.stdout + proc.stderr)[-1500:]


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    failures = 0
    total = 0
    for mdx in sorted(CONTENT.rglob("*.mdx")):
        rel = mdx.relative_to(CONTENT)
        if only not in str(rel):
            continue
        source = mdx.read_text()
        for full in re.findall(r"<CodeExercise\b.*?</CodeExercise>", source, flags=re.S):
            ident = re.search(r'id="([^"]+)"', full)
            solution = extract(full, "solution")
            check = extract(full, "check") or ""
            expected = extract(full, "expectedOutput")
            label = f"{rel}#{ident.group(1) if ident else '?'}"
            total += 1
            if solution is None:
                print(f"✗ {label}: no solution prop")
                failures += 1
                continue
            ok, out = run(f"{solution}\n{check}", files_of(full))
            if ok and expected is not None:
                printed = "\n".join(line.rstrip() for line in out.strip().splitlines())
                ok = printed == "\n".join(line.rstrip() for line in expected.splitlines())
            print(("✓ " if ok else "✗ ") + label)
            if not ok:
                failures += 1
                print(textwrap.indent(out, "    "))
        for full in re.findall(r"<RunCode\b.*?/>", source, flags=re.S):
            code = extract(full, "code")
            if code is None:
                continue
            total += 1
            ok, out = run(code, files_of(full))
            print(("✓ " if ok else "✗ ") + f"{rel} (ejemplo)")
            if not ok:
                failures += 1
                print(textwrap.indent(out, "    "))
    print(f"\n{total - failures}/{total} OK")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
