import { useState, useEffect, useContext, useMemo } from "react";

import View from "../components/View";
import Stepper from "../components/Progress/Stepper";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Timer from "../components/Progress/Timer";
import { useForgetClass } from "../hooks/useForgetClass";
import { ViewProps } from "../types/common";
import { Step } from "../types/progress";
import { VitalIcon } from "../components/UI/icons";
import { RunningStatusContext } from "../store/running-status-context";
import { getProgressSteps } from "../utils/data/getProgressSteps";

export default function Progress({ width, height }: ViewProps) {
  const { isRunning, status, activeStep } = useContext(RunningStatusContext);

  const { forgetClassNumber, forgetClassExist } = useForgetClass();

  const [umapProgress, setUmapProgress] = useState(0);
  const [ckaProgress, setCkaProgress] = useState(0);

  const progress = forgetClassExist ? status[forgetClassNumber].progress : "";
  const steps: Step[] = useMemo(
    () =>
      forgetClassExist
        ? getProgressSteps(
            status[forgetClassNumber],
            activeStep,
            umapProgress,
            ckaProgress
          )
        : [],
    [
      activeStep,
      ckaProgress,
      forgetClassExist,
      forgetClassNumber,
      status,
      umapProgress,
    ]
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
              {isRunning || status[forgetClassNumber].completed_steps.length ? (
                <Timer />
              ) : null}
            </div>
          )
        }
      />
      {forgetClassExist ? (
        <Stepper
          steps={steps}
          activeStep={activeStep}
          completedSteps={status[forgetClassNumber].completed_steps}
          isRunning={isRunning}
        />
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
