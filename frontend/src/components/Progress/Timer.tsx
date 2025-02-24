import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

import { useRunningStatusStore } from "../../stores/runningStatusStore";
import { useRunningIndexStore } from "../../stores/runningIndexStore";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { Separator } from "../../components/UI/separator";

export default function Timer() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const runningIndex = useRunningIndexStore((state) => state.runningIndex);
  const statuses = useRunningStatusStore((state) => state.statuses);
  const isRunning = useRunningStatusStore((state) => state.isRunning);

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
      <span className="text-xs">
        ID: {statuses[forgetClass][runningIndex].recent_id}
      </span>
      <Separator orientation="vertical" className="h-4" />
      <div>
        <div className="flex items-center gap-1">
          <Clock className="text-muted-foreground w-3 h-3" />
          <span className="text-xs">
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
