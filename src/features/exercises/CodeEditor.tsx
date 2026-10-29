import { lazy, Suspense, type ReactNode } from "react";

import styles from "./Exercise.module.css";

// CodeMirror is most of the exercise code: it loads with the first editor on a page,
// not with the app. Until then the code is shown as plain text.
const CodeMirrorEditor = lazy(() => import("./CodeMirrorEditor"));

interface Props {
  value: string;
  onChange?: (value: string) => void;
  isReadOnly?: boolean;
  label?: string;
  onFocus?: () => void;
}

export function CodeEditor(props: Props): ReactNode {
  return (
    <Suspense
      fallback={
        <pre className={styles.editorFallback}>
          <code>{props.value}</code>
        </pre>
      }
    >
      <CodeMirrorEditor {...props} />
    </Suspense>
  );
}
