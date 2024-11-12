import { useState, useEffect, useContext, useCallback } from "react";
import { Check, Dot, Loader2 } from "lucide-react";

import { Button } from "../components/UI/button";
import { fetchDataFile } from "../https/unlearning";
import { ExperimentsContext } from "../store/experiments-context";
import { RunningStatusContext } from "../store/running-status-context";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { fetchUnlearningStatus, cancelUnlearning } from "../https/utils";
import { VitalIcon } from "../components/UI/icons";
import { ForgetClassContext } from "../store/forget-class-context";
import {
  Stepper,
  StepperDescription,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "../components/UI/stepper";

export default function RunningStatus({ height }: { height: number }) {
  const { addExperiment } = useContext(ExperimentsContext);
  const { forgetClass } = useContext(ForgetClassContext);
  const { saveComparison } = useContext(BaselineComparisonContext);
  const { isRunning, status, updateIsRunning, initStatus, updateStatus } =
    useContext(RunningStatusContext);

  const [activeStep, setActiveStep] = useState(0);
  const [umapProgress, setUmapProgress] = useState(0);

  const steps = [
    {
      step: 1,
      title: "Unlearn",
      description: `Current Epoch: ${
        status.current_epoch === 0 ? "-" : status.current_epoch
      }/${
        status.total_epochs === 0 ? "-" : status.total_epochs
      }\nUnlearning Loss: ${
        status.current_unlearn_loss === 0 ? "-" : status.current_unlearn_loss
      } | Unlearning Accuracy: ${
        status.current_unlearn_accuracy === 0
          ? "-"
          : status.current_unlearn_accuracy + "%"
      }`,
    },
    {
      step: 2,
      title: "Evaluate",
      description: `Training Loss: ${
        status.p_training_loss === 0 ? "-" : status.p_training_loss
      } | Training Accuracy: ${
        status.p_training_accuracy === 0
          ? "-"
          : status.p_training_accuracy + "%"
      }\nTest Loss: ${
        status.p_test_loss === 0 ? "-" : status.p_test_loss
      } | Test Accuracy: ${
        status.p_test_accuracy === 0 ? "-" : status.p_test_accuracy + "%"
      }`,
    },
    {
      step: 3,
      title: "Analyze",
      description: `Computing UMAP Embedding... ${
        status.progress.includes("UMAP") ? `${umapProgress}%` : ""
      }\nCalculating CKA Similarity... ${
        status.progress === "Idle" && status.total_epochs !== 0 ? "100%" : ""
      }\nDone! Experiment ID: ${
        status.total_epochs !== 0 && status.progress === "Idle"
          ? status.recent_id
          : "-"
      }`,
    },
  ];

  const checkStatus = useCallback(async () => {
    try {
      const unlearningStatus = await fetchUnlearningStatus();

      updateStatus(unlearningStatus);

      const progress = unlearningStatus.progress;
      if (progress === "Idle" || progress === "Unlearning") {
        setActiveStep(1);
      } else if (progress.includes("Evaluating")) {
        setActiveStep(2);
      } else if (progress.includes("UMAP") || progress.includes("CKA")) {
        setActiveStep(3);
      }

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
      updateIsRunning(false);
      await cancelUnlearning();
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (status.progress.includes("UMAP")) {
      const startTime = Date.now();
      const duration = 10000;

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.floor((elapsed / duration) * 100), 100);

        setUmapProgress(progress);

        if (progress === 100) {
          clearInterval(intervalId!);
        }
      }, 100);
    } else {
      setUmapProgress(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status.progress]);

  // const handleCancelClick = async () => {
  //   if (window.confirm("Are you sure you want to cancel the experiment?")) {
  //     await cancelUnlearning();
  //     updateIsRunning(false);
  //     initStatus();
  //   }
  // };

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[402px] p-1 relative border"
    >
      <div className="flex items-center">
        <VitalIcon />
        <h5 className="font-semibold ml-1 text-lg">Progress</h5>
      </div>
      <div>
        <Stepper className="mx-auto flex w-full max-w-md flex-col justify-start gap-1.5">
          {steps.map((step, idx) => {
            const isNotLastStep = idx !== steps.length - 1;

            let state: "completed" | "active" | "inactive";
            if (step.step < activeStep) state = "completed";
            else if (step.step === activeStep) state = "active";
            else state = "inactive";

            return (
              <StepperItem
                key={idx}
                className="relative flex w-full items-start gap-3"
              >
                {isNotLastStep && (
                  <StepperSeparator className="absolute left-[23px] top-[38px] block h-[calc(100%)] w-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary">
                    <div />
                  </StepperSeparator>
                )}
                <StepperTrigger>
                  <Button className="w-8 h-8 p-0 rounded-full z-10">
                    {state === "completed" && <Check className="size-4" />}
                    {state === "active" && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {state === "inactive" && <Dot className="size-4" />}
                  </Button>
                </StepperTrigger>
                <div className="flex flex-col">
                  <StepperTitle className="text-sm font-semibold transition lg:text-base">
                    {step.title}
                  </StepperTitle>
                  <StepperDescription className="text-xs text-muted-foreground whitespace-pre-line transition md:not-sr-only lg:text-sm">
                    {step.description.split("\n").map((el, idx) => (
                      <p key={idx}>{el}</p>
                    ))}
                  </StepperDescription>
                </div>
              </StepperItem>
            );
          })}
        </Stepper>
      </div>
      {/* {isRunning && (
        <CustomButton
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
      )} */}
    </section>
  );
}
