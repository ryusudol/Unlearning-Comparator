import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Clock } from "lucide-react";

import {
  fetchUnlearningStatus,
  cancelUnlearning,
} from "../../utils/api/requests";
import {
  getCurrentProgress,
  getCompletedSteps,
} from "../../utils/data/running-status-context";
import { ExperimentsContext } from "../../store/experiments-context";
import { ForgetClassContext } from "../../store/forget-class-context";
import { RunningStatusContext } from "../../store/running-status-context";
import { BaselineComparisonContext } from "../../store/baseline-comparison-context";
import { fetchDataFile } from "../../utils/api/unlearning";
import { Separator } from "../../components/UI/separator";

export default function Timer() {
  const { forgetClass } = useContext(ForgetClassContext);
  const { addExperiment } = useContext(ExperimentsContext);
  const { saveComparison } = useContext(BaselineComparisonContext);
  const { status, isRunning, updateIsRunning, updateStatus, updateActiveStep } =
    useContext(RunningStatusContext);

  const [runningTime, setRunningTime] = useState(0);

  const runningTimeRef = useRef(runningTime);

  useEffect(() => {
    runningTimeRef.current = runningTime;
  }, [runningTime]);

  const checkStatus = useCallback(async () => {
    try {
      const unlearningStatus = await fetchUnlearningStatus();

      const progress = getCurrentProgress(unlearningStatus);
      const completedSteps: number[] = getCompletedSteps(
        progress,
        unlearningStatus
      );

      updateStatus({
        status: unlearningStatus,
        forgetClass: forgetClass as number,
        progress,
        elapsedTime: runningTimeRef.current,
        completedSteps,
      });

      if (progress.includes("Evaluating")) {
        updateActiveStep(2);
      } else if (progress.includes("UMAP") || progress.includes("CKA")) {
        updateActiveStep(3);
      }

      if (!unlearningStatus.is_unlearning) {
        updateIsRunning(false);
        updateActiveStep(0);

        try {
          const newData = await fetchDataFile(
            forgetClass as number,
            unlearningStatus.recent_id as string
          );
          addExperiment(newData);
          saveComparison(newData.id);
        } catch (error) {
          console.error("Failed to fetch data file:", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch unlearning status:", error);
      updateIsRunning(false);
      await cancelUnlearning();
    }
  }, [
    addExperiment,
    forgetClass,
    saveComparison,
    updateActiveStep,
    updateIsRunning,
    updateStatus,
  ]);

  useEffect(() => {
    let statusIntervalId: ReturnType<typeof setInterval> | null = null;
    let timerIntervalId: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      setRunningTime(0);
      statusIntervalId = setInterval(checkStatus, 1000);
      timerIntervalId = setInterval(() => {
        setRunningTime((prev) => prev + 0.1);
      }, 100);
    }

    return () => {
      if (statusIntervalId) {
        clearInterval(statusIntervalId);
      }
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
    };
  }, [checkStatus, isRunning]);

  return (
    <>
      <Separator orientation="vertical" className="h-4" />
      <div>
        <div className="flex items-center gap-1 relative top-0.5">
          <Clock className="text-muted-foreground w-3 h-3" />
          <span className="text-sm">
            {isRunning
              ? runningTime.toFixed(1)
              : status[forgetClass as number].elapsed_time.toFixed(1)}
            s
          </span>
        </div>
      </div>
    </>
  );
}
