import { useEffect } from "react";

export type Timer = ReturnType<typeof setInterval> | undefined;

export async function useInterval(
  operationStatus: number,
  interval: React.MutableRefObject<Timer>,
  checkFn: () => Promise<void>
) {
  useEffect(() => {
    let isMounted = true;
    const runInterval = async () => {
      if (isMounted && operationStatus) {
        await checkFn();
        interval.current = setTimeout(runInterval, 1000);
      }
    };

    if (operationStatus) {
      runInterval();
    } else {
      if (interval.current) {
        clearTimeout(interval.current);
        interval.current = undefined;
      }
    }

    return () => {
      isMounted = false;
      if (interval.current) {
        clearTimeout(interval.current);
      }
    };
  }, [checkFn, interval, operationStatus]);
}
