import { createContext, useContext, type ReactNode } from "react";

import { exerciseKey, progressStore, useProgress } from "@/features/progress";

interface Scope {
  subject: string;
  lesson: string;
}

const ExerciseScopeContext = createContext<Scope | null>(null);

/** Tells the exercises of a lesson which lesson they belong to, for progress keys. */
export function ExerciseScope({
  subject,
  lesson,
  children,
}: Scope & { children: ReactNode }): ReactNode {
  return (
    <ExerciseScopeContext.Provider value={{ subject, lesson }}>
      {children}
    </ExerciseScopeContext.Provider>
  );
}

export function useExerciseProgress(id: string): { isSolved: boolean; markSolved: () => void } {
  const scope = useContext(ExerciseScopeContext);
  const progress = useProgress();
  if (scope === null) {
    // Outside a lesson (tests, previews) exercises still work, they just are not recorded.
    return { isSolved: false, markSolved: () => undefined };
  }
  const key = exerciseKey(scope.subject, scope.lesson, id);
  return {
    isSolved: progress.exercises[key] !== undefined,
    markSolved: () => {
      progressStore.markExerciseSolved(key);
    },
  };
}
