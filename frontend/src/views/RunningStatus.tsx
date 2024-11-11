import { useEffect, useContext, useCallback } from "react";

import Button from "../components/Button";
import { fetchDataFile } from "../https/unlearning";
import { ExperimentsContext } from "../store/experiments-context";
import { RunningStatusContext } from "../store/running-status-context";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { fetchUnlearningStatus, cancelUnlearning } from "../https/utils";
import { Chart01Icon, MultiplicationSignIcon } from "../components/UI/icons";
import { useLoadingDots } from "../hooks/useLoadingDots";
import { ForgetClassContext } from "../store/forget-class-context";

export default function RunningStatus({ height }: { height: number }) {
  const { addExperiment } = useContext(ExperimentsContext);
  const { forgetClass } = useContext(ForgetClassContext);
  const { saveComparison } = useContext(BaselineComparisonContext);
  const { isRunning, status, updateIsRunning, initStatus, updateStatus } =
    useContext(RunningStatusContext);

  const loadingDots = useLoadingDots();

  const checkStatus = useCallback(async () => {
    try {
      const unlearningStatus = await fetchUnlearningStatus();

      updateStatus(unlearningStatus);

      if (!unlearningStatus.is_unlearning) {
        updateIsRunning(false);

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
    }
  }, [
    addExperiment,
    forgetClass,
    saveComparison,
    updateIsRunning,
    updateStatus,
  ]);

  useEffect(() => {
    initStatus();
  }, [initStatus]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning) {
      intervalId = setInterval(checkStatus, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkStatus, isRunning, status.progress]);

  const handleCancelClick = async () => {
    if (window.confirm("Are you sure you want to cancel the experiment?")) {
      await cancelUnlearning();
      updateIsRunning(false);
      initStatus();
    }
  };

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[402px] p-1 relative border"
    >
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-1 text-lg">Running Status</h5>
      </div>
      <div>
        <p className="text-lg font-medium">
          Progress: {status.progress}
          {isRunning ? loadingDots : ""}
        </p>
        <div>
          <span className="mr-1">Current Epoch:</span>
          <span>{status.current_epoch}</span>
        </div>
        <div>
          <span className="mr-1">Total Epochs:</span>
          <span>{status.total_epochs}</span>
        </div>
        <div>
          <span className="mr-1">Current Unlearn Loss:</span>
          <span>{status.current_unlearn_loss}</span>
        </div>
        <div>
          <span className="mr-1">Current Unlearn Accuracy:</span>
          <span>{status.current_unlearn_accuracy}</span>
        </div>
        <div>
          <span className="mr-1">Estimated Time Remaining:</span>
          <span>{status.estimated_time_remaining}</span>
        </div>
      </div>
      {isRunning && (
        <Button
          onClick={handleCancelClick}
          content={
            <>
              <MultiplicationSignIcon
                className="w-5 h-5 mr-0.5"
                color="white"
              />
              <span className="text-base">Cancel</span>
            </>
          }
          className="flex items-center w-16 bg-red-600 hover:bg-red-700"
        />
      )}
    </section>
  );
}
