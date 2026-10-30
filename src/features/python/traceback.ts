/**
 * Turns a Pyodide traceback into what a learner needs: the frames of their own code
 * (`<exec>`) and the final error line, without Pyodide's internal frames.
 */
export function cleanTraceback(raw: string): { message: string; traceback: string } {
  const lines = raw.trimEnd().split("\n");
  const message = lines.at(-1) ?? raw;
  const kept: string[] = [];
  let keepNext = false;
  for (const line of lines) {
    if (line.startsWith("Traceback")) {
      kept.push(line);
      continue;
    }
    if (line.startsWith('  File "')) {
      keepNext = line.includes("<exec>") || line.includes("<string>");
      if (keepNext) kept.push(line.replace(/File "<(exec|string)>"/, "Tu código"));
      continue;
    }
    if (line.startsWith("    ")) {
      if (keepNext) kept.push(line);
      continue;
    }
    kept.push(line);
  }
  return { message, traceback: kept.join("\n") };
}

const LEARNER_FRAME = /^ {2}File "<(?:exec|string)>", line (\d+)/;

/**
 * The lines of the learner's code that appear in a traceback, in order and without
 * repeats: the call chain down to the line that failed. The check runs under another file
 * name, so its frames never count here.
 */
export function learnerLines(raw: string): number[] {
  const lines = raw
    .split("\n")
    .map((line) => LEARNER_FRAME.exec(line)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  return [...new Set(lines)];
}
