import { useState, useEffect, useContext } from "react";

import View from "../components/View";
import Stepper from "../components/Progress/Stepper";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Timer from "../components/Progress/Timer";
import { ViewProps } from "../types/common";
import { Step } from "../types/progress";
import { VitalIcon } from "../components/UI/icons";
import { RunningStatusContext } from "../store/running-status-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { getProgressSteps } from "../utils/data/getProgressSteps";

export default function Progress({ width, height }: ViewProps) {
  const { forgetClass } = useContext(ForgetClassContext);
  const { isRunning, status, activeStep, completedSteps } =
    useContext(RunningStatusContext);

  const [umapProgress, setUmapProgress] = useState(0);
  const [ckaProgress, setCkaProgress] = useState(0);

  const forgetClassExist =
    forgetClass !== undefined && status[forgetClass as number] !== undefined;
  const progress = forgetClassExist
    ? status[forgetClass as number].progress
    : "";
  const steps: Step[] = getProgressSteps(
    status[forgetClass as number],
    completedSteps,
    activeStep,
    umapProgress,
    ckaProgress
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const startTime = Date.now();
    const duration = 10000;

    if (forgetClassExist) {
      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressValue = Math.min(
          Math.floor((elapsed / duration) * 100),
          100
        );

        if (progress.includes("UMAP")) {
          setUmapProgress(progressValue);
        } else if (progress.includes("CKA")) {
          setCkaProgress(progressValue);
        }

        if (progressValue === 100) {
          clearInterval(intervalId!);
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [forgetClassExist, progress]);

  return (
    <View width={width} height={height} className="border-t-0">
      <Title
        Icon={<VitalIcon />}
        title="Progress"
        AdditionalContent={
          forgetClassExist && (
            <div className="flex items-center gap-1.5 ml-1.5">
              {isRunning || completedSteps.length ? <Timer /> : null}
            </div>
          )
        }
      />
      {forgetClassExist ? (
        <Stepper
          steps={steps}
          activeStep={activeStep}
          completedSteps={completedSteps}
          isRunning={isRunning}
        />
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
