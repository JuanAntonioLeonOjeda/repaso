import { useEffect, useRef } from "react";

/**
 * Calls `tick` on every animation frame while `isRunning`, at most `stepsPerSecond`
 * times a second. Respects reduced motion by slowing down to a few steps a second.
 */
export function useAnimation(isRunning: boolean, stepsPerSecond: number, tick: () => void): void {
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });

  useEffect(() => {
    if (!isRunning) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interval = 1000 / (reduced ? Math.min(stepsPerSecond, 4) : stepsPerSecond);
    let last = 0;
    let frame = requestAnimationFrame(function loop(time) {
      if (time - last >= interval) {
        last = time;
        tickRef.current();
      }
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isRunning, stepsPerSecond]);
}
