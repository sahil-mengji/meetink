import { useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

export function useMountProgress(
  enterTransition?: any,
  delay: number = 0,
  index: number = 0
) {
  const progress = useMotionValue(0);
  const spring = useSpring(progress, {
    stiffness: 300,
    damping: 25,
    bounce: 0,
    ...enterTransition,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.set(1);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay, progress]);

  return spring;
}
