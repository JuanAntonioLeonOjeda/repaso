import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useMemo, type ReactNode } from "react";

import { useTheme } from "@/features/shell";
import { es } from "@/i18n/es";

import { errorLinesExtension } from "./error-lines";
import styles from "./Exercise.module.css";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  isReadOnly?: boolean;
  label?: string;
  onFocus?: () => void;
  errorLines?: readonly number[] | undefined;
}

const NO_LINES: readonly number[] = [];

export default function CodeMirrorEditor({
  value,
  onChange,
  isReadOnly = false,
  label = es.exercise.editorLabel,
  onFocus,
  errorLines = NO_LINES,
}: Props): ReactNode {
  const theme = useTheme();
  const extensions = useMemo(
    () => [
      python(),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": label }),
      errorLinesExtension(errorLines, styles.errorLine ?? ""),
    ],
    [label, errorLines],
  );
  return (
    <div className={styles.editor}>
      <CodeMirror
        value={value}
        onChange={(next) => onChange?.(next)}
        onFocus={onFocus}
        readOnly={isReadOnly}
        editable={!isReadOnly}
        theme={theme === "dark" ? oneDark : "light"}
        extensions={extensions}
        basicSetup={{
          foldGutter: false,
          highlightActiveLine: !isReadOnly,
          highlightActiveLineGutter: !isReadOnly,
          autocompletion: false,
        }}
      />
    </div>
  );
}
