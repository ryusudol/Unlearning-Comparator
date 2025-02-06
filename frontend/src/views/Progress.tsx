import { useState, useEffect, useContext, useMemo } from "react";

import View from "../components/View";
import Stepper from "../components/Progress/Stepper";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Timer from "../components/Progress/Timer";
import Pagination from "../components/Progress/Pagination";
import { useForgetClass } from "../hooks/useForgetClass";
import { ViewProps } from "../types/common";
import { Step } from "../types/progress";
import { VitalIcon } from "../components/UI/icons";
import { RunningStatusContext } from "../store/running-status-context";
import { getProgressSteps } from "../utils/data/getProgressSteps";

export const PREV = "prev";
export const NEXT = "next";

export default function Progress({ width, height }: ViewProps) {
  const {
    isRunning,
    statuses,
    activeStep,
    currentIndex,
    totalExperimentsCount,
  } = useContext(RunningStatusContext);

  const { forgetClassNumber, forgetClassExist } = useForgetClass();

  const [umapProgress, setUmapProgress] = useState(0);
  const [ckaProgress, setCkaProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(currentIndex + 1);

  useEffect(() => {
    if (isRunning) {
      setCurrentPage(1);
    }
  }, [isRunning]);

  useEffect(() => {
    setCurrentPage(currentIndex + 1);
  }, [currentIndex]);

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
    <View width={width} height={height} className="border-t-0">
      <div className="flex justify-between">
        <Title
          Icon={<VitalIcon />}
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
            displayedPageIdx === currentIndex
              ? activeStep
              : (currentStatus?.completed_steps?.length ?? 0) + 1
          }
          completedSteps={currentStatus?.completed_steps || []}
          isRunning={displayedPageIdx === currentIndex ? isRunning : false}
        />
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
