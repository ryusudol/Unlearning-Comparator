import { useState, useEffect, useContext } from "react";
import { Clock } from "lucide-react";

import { RunningStatusContext } from "../../store/running-status-context";
import { useForgetClass } from "../../hooks/useForgetClass";
import { Separator } from "../../components/UI/separator";

export default function Timer() {
  const { statuses, isRunning, currentIndex } =
    useContext(RunningStatusContext);

  const { forgetClassNumber } = useForgetClass();

  const [runningTime, setRunningTime] = useState(0);

  useEffect(() => {
    let timerIntervalId: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      setRunningTime(0);
      timerIntervalId = setInterval(() => {
        setRunningTime((prev) => prev + 0.1);
      }, 100);
    }

    return () => {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
    };
  }, [isRunning]);

  return (
    <>
      <Separator orientation="vertical" className="h-4" />
      <div>
        <div className="flex items-center gap-1 relative top-0.5">
          <Clock className="text-muted-foreground w-3 h-3" />
          <span className="text-sm">
            {isRunning
              ? runningTime.toFixed(1)
              : statuses[forgetClassNumber][currentIndex].elapsed_time.toFixed(
                  1
                )}
            s
          </span>
        </div>
      </div>
    </>
  );
}
