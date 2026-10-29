/**
 * Learning progress, kept in this browser only (no accounts, no server: ADR-0003).
 *
 * The store is a tiny external store read through `useSyncExternalStore`, so every
 * component that shows progress updates when an exercise is solved anywhere on the page.
 */

const STORAGE_KEY = "repaso-progress-v1";

export interface Progress {
  /** Lesson key (`subject/lesson`) → ISO date when it was marked done. */
  lessons: Record<string, string>;
  /** Exercise key (`subject/lesson#id`) → ISO date when it was first solved. */
  exercises: Record<string, string>;
  /** Last lesson opened, to offer "continue where you left off". */
  lastLesson: string | null;
}

const EMPTY: Progress = { lessons: {}, exercises: {}, lastLesson: null };

type Listener = () => void;

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((v) => typeof v === "string")
  );
}

export function parseProgress(raw: string | null): Progress {
  if (raw === null) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY;
    const { lessons, exercises, lastLesson } = data as Record<string, unknown>;
    return {
      lessons: isRecordOfStrings(lessons) ? lessons : {},
      exercises: isRecordOfStrings(exercises) ? exercises : {},
      lastLesson: typeof lastLesson === "string" ? lastLesson : null,
    };
  } catch {
    // A corrupt entry must not break the app: start again from empty progress.
    return EMPTY;
  }
}

export function lessonKey(subject: string, lesson: string): string {
  return `${subject}/${lesson}`;
}

export function exerciseKey(subject: string, lesson: string, id: string): string {
  return `${subject}/${lesson}#${id}`;
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: progress lives for this session only.
  }
}

let state: Progress = parseProgress(readStorage());
const listeners = new Set<Listener>();

function update(next: Progress): void {
  state = next;
  writeStorage(next);
  listeners.forEach((listener) => {
    listener();
  });
}

export const progressStore = {
  // Arrow properties, not methods: they are passed around unbound to useSyncExternalStore.
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: (): Progress => state,
  setLessonDone(key: string, done: boolean): void {
    const lessons = done
      ? { ...state.lessons, [key]: new Date().toISOString() }
      : Object.fromEntries(Object.entries(state.lessons).filter(([k]) => k !== key));
    update({ ...state, lessons });
  },
  markExerciseSolved(key: string): void {
    if (state.exercises[key] !== undefined) return;
    update({ ...state, exercises: { ...state.exercises, [key]: new Date().toISOString() } });
  },
  visitLesson(key: string): void {
    if (state.lastLesson === key) return;
    update({ ...state, lastLesson: key });
  },
};
