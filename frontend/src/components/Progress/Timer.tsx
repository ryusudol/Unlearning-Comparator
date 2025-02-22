import { useState, useEffect, useContext } from "react";
import { Clock } from "lucide-react";

import { RunningStatusContext } from "../../stores/running-status-context";
import { useRunningIndexStore } from "../../stores/runningIndexStore";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { Separator } from "../../components/UI/separator";

export default function Timer() {
  const { forgetClass } = useForgetClassStore();

  const { runningIndex } = useRunningIndexStore();
  const { statuses, isRunning } = useContext(RunningStatusContext);

  const [runningTime, setRunningTime] = useState(0);

  useEffect(() => {
    let timerIntervalId: ReturnType<typeof setInterval> | null = null;
    let startTime: number;

    if (isRunning) {
      startTime = Date.now();
      setRunningTime(0);

      timerIntervalId = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRunningTime(elapsed);
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
              : statuses[forgetClass][runningIndex].elapsed_time.toFixed(1)}
            s
          </span>
        </div>
      </div>
    </>
  );
}
