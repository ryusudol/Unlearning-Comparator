import { useEffect, useContext, useCallback } from "react";
import { promises as fs } from "fs";
import path from "path";

import Button from "../components/Button";
import { fetchDataFile } from "../https/unlearning";
import { ForgetClassContext } from "../store/forget-class-context";
import { RunningStatusContext } from "../store/running-status-context";
import { fetchUnlearningStatus, cancelUnlearning } from "../https/utils";
import { Chart01Icon, MultiplicationSignIcon } from "../components/UI/icons";
import { useLoadingDots } from "../hooks/useLoadingDots";

export default function RunningStatus({ height }: { height: number }) {
  const { forgetClass } = useContext(ForgetClassContext);
  const { isRunning, status, updateIsRunning, initStatus, updateStatus } =
    useContext(RunningStatusContext);

  const loadingDots = useLoadingDots();

  const checkStatus = useCallback(async () => {
    try {
      const unlearningStatus = await fetchUnlearningStatus();

      if (JSON.stringify(status) !== JSON.stringify(unlearningStatus)) {
        updateStatus(unlearningStatus);
      }
      if (!unlearningStatus.is_unlearning) {
        updateIsRunning(false);
        const res = await fetchDataFile(
          forgetClass as number,
          status.recent_id as string
        );
        const jsonString = JSON.stringify(res, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${status.recent_id}.json`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to fetch unlearning status or result:", error);
    }
  }, [forgetClass, status, updateIsRunning, updateStatus]);

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
              <span className="text-base">Cancel the Experiment</span>
            </>
          }
          className="w-full flex items-center"
        />
      )}
    </section>
  );
}
