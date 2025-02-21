import { useState, useEffect, useContext, useMemo } from "react";

import View from "../components/View";
import Stepper from "../components/Progress/Stepper";
import Subtitle from "../components/Subtitle";
import Indicator from "../components/Indicator";
import Timer from "../components/Progress/Timer";
import Pagination from "../components/Progress/Pagination";
import { useForgetClass } from "../hooks/useForgetClass";
import { Step } from "../types/progress";
import { CONFIG } from "../app/App";
import { RunningStatusContext } from "../stores/running-status-context";
import { RunningIndexContext } from "../stores/running-index-context";
import { getProgressSteps } from "../utils/data/getProgressSteps";

export const PREV = "prev";
export const NEXT = "next";

export default function Progress() {
  const { isRunning, statuses, activeStep, totalExperimentsCount } =
    useContext(RunningStatusContext);
  const { runningIndex } = useContext(RunningIndexContext);

  const { forgetClassNumber, forgetClassExist } = useForgetClass();

  const [umapProgress, setUmapProgress] = useState(0);
  const [ckaProgress, setCkaProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(runningIndex + 1);

  useEffect(() => {
    if (isRunning) {
      setCurrentPage(1);
    }
  }, [isRunning]);

  useEffect(() => {
    setCurrentPage(runningIndex + 1);
  }, [runningIndex]);

  const displayedPageIdx = currentPage - 1;

  const currentStatus =
    forgetClassExist && statuses[forgetClassNumber].length > displayedPageIdx
      ? statuses[forgetClassNumber][displayedPageIdx]
      : null;

  const progress = currentStatus ? currentStatus.progress : "";

  const steps: Step[] = useMemo(
    () =>
      forgetClassExist
        ? getProgressSteps(currentStatus, activeStep, umapProgress, ckaProgress)
        : [],
    [activeStep, ckaProgress, currentStatus, forgetClassExist, umapProgress]
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const startTime = Date.now();
    const durationInSeconds = 10;
    const maxProgress = durationInSeconds * 10;

    if (forgetClassExist && progress) {
      intervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progressValue = Math.min(
          Math.floor(elapsedTime / 100),
          maxProgress
        );

        if (progress.includes("UMAP")) {
          setUmapProgress(progressValue);
        } else if (progress.includes("CKA")) {
          setCkaProgress(progressValue);
        }

        if (progressValue === maxProgress) {
          clearInterval(intervalId!);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [forgetClassExist, progress]);

  const handlePaginationClick = (event: React.MouseEvent<HTMLLIElement>) => {
    const id = event.currentTarget.id;
    if (id === PREV && currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    } else if (id === NEXT && currentPage < totalExperimentsCount) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <View
      width={CONFIG.PROGRESS_WIDTH}
      height={CONFIG.EXPERIMENTS_PROGRESS_HEIGHT}
      className="border-t-0 border-l-0"
    >
      <div className="flex justify-between">
        <Subtitle
          title="Progress"
          AdditionalContent={
            (forgetClassExist &&
              (isRunning ||
                (currentStatus &&
                  currentStatus.completed_steps.length > 0)) && (
                <div className="flex items-center gap-1.5 ml-1.5">
                  <Timer />
                </div>
              )) ||
            undefined
          }
        />
        {totalExperimentsCount > 0 &&
          statuses[forgetClassNumber].length > 0 && (
            <Pagination
              currentPage={currentPage}
              onClick={handlePaginationClick}
            />
          )}
      </div>
      {forgetClassExist ? (
        <Stepper
          steps={steps}
          activeStep={
            displayedPageIdx === runningIndex
              ? activeStep
              : (currentStatus?.completed_steps?.length ?? 0) + 1
          }
          completedSteps={currentStatus?.completed_steps || []}
          isRunning={displayedPageIdx === runningIndex ? isRunning : false}
        />
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
