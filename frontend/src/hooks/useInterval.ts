import { useEffect } from "react";

export type Timer = ReturnType<typeof setInterval> | undefined;

export async function useInterval(
  operationStatus: number,
  interval: React.MutableRefObject<Timer>,
  checkFn: () => void
) {
  useEffect(() => {
    if (operationStatus && !interval.current)
      interval.current = setInterval(checkFn, 5000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [checkFn, interval, operationStatus]);
}
