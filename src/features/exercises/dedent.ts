/**
 * Code in lessons is written as indented template literals inside MDX; this removes the
 * first empty line, the trailing whitespace and the indentation common to every line.
 */
export function dedent(code: string): string {
  const lines = code
    .replace(/^\s*\n/, "")
    .trimEnd()
    .split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => /^ */.exec(line)?.[0].length ?? 0);
  const common = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(common)).join("\n");
}
