import { Decoration, EditorView, type Extension } from "@uiw/react-codemirror";

/** The 1-based line numbers that exist in a document of `total` lines, sorted, once each. */
export function validLines(lines: readonly number[], total: number): number[] {
  return [...new Set(lines)].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

/**
 * Marks the lines where Python failed. A line decoration (a class on the line's element), so
 * the styling lives in the CSS module with the rest of the editor.
 */
export function errorLinesExtension(lines: readonly number[], className: string): Extension {
  const mark = Decoration.line({ class: className });
  return EditorView.decorations.compute(["doc"], (state) =>
    Decoration.set(
      validLines(lines, state.doc.lines).map((n) => mark.range(state.doc.line(n).from)),
    ),
  );
}
