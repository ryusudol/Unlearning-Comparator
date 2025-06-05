import { useState, useEffect, useMemo } from "react";

import View from "../../components/common/View";
import Stepper from "../../components/ModelScreening/Progress/Stepper";
import Indicator from "../../components/common/Indicator";
import AddModelsButton from "../../components/ModelScreening/Progress/AddModelsButton";
import Pagination from "../../components/ModelScreening/Progress/Pagination";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { CONFIG } from "../../app/App";
import { useRunningIndexStore } from "../../stores/runningIndexStore";
import { useRunningStatusStore } from "../../stores/runningStatusStore";
import { getProgressSteps } from "../../utils/data/getProgressSteps";

export type Step = {
  step: number;
  title: string;
  description: string;
};

export const PREV = "prev";
export const NEXT = "next";

export default function Progress() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const runningIndex = useRunningIndexStore((state) => state.runningIndex);
  const { isRunning, statuses, activeStep, totalExperimentsCount } =
    useRunningStatusStore();

  const [umapProgress, setUmapProgress] = useState(0);
  const [ckaProgress, setCkaProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(runningIndex + 1);

  const displayedPageIdx = currentPage - 1;
  const forgetClassExist = forgetClass !== -1;

  useEffect(() => {
    if (isRunning) {
      setCurrentPage(1);
    }
  }, [isRunning]);

  useEffect(() => {
    setCurrentPage(runningIndex + 1);
  }, [runningIndex]);

  const currentStatus =
    forgetClassExist && statuses[forgetClass].length > displayedPageIdx
      ? statuses[forgetClass][displayedPageIdx]
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
    >
      <AddModelsButton />
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
      {totalExperimentsCount > 0 && statuses[forgetClass].length > 0 && (
        <Pagination currentPage={currentPage} onClick={handlePaginationClick} />
      )}
    </View>
  );
}
