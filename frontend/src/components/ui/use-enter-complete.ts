import { useEffect, useState } from "react";
import { MotionValue } from "motion/react";

export function useEnterComplete(mountProgress: MotionValue<number>) {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    return mountProgress.on("change", (latest) => {
      if (latest >= 0.99) {
        setComplete(true);
      }
    });
  }, [mountProgress]);

  return complete;
}
