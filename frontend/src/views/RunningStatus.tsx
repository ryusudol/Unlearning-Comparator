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
  const {
    isRunning,
    status,
    activeStep,
    updateIsRunning,
    initStatus,
    updateStatus,
    updateActiveStep,
  } = useContext(RunningStatusContext);

  const [umapProgress, setUmapProgress] = useState(0);
  const [ckaProgress, setCkaProgress] = useState(0);

  const isFirstRunning = status.total_epochs === 0;
  const progress = status.progress;

  const steps = [
    {
      step: 1,
      title: "Unlearn",
      description: `Method: ${status.method ? status.method : "-"} | Epochs: ${
        isFirstRunning ? "-" : status.current_epoch + "/" + status.total_epochs
      }\nUnlearning Loss: ${
        status.current_unlearn_loss === 0
          ? "-"
          : status.current_unlearn_loss.toFixed(3)
      } | Unlearning Accuracy: ${
        status.current_unlearn_accuracy === 0
          ? "-"
          : status.current_unlearn_accuracy
      }`,
    },
    {
      step: 2,
      title: "Evaluate",
      description: `Training Loss: ${
        status.p_training_loss === 0 ? "-" : status.p_training_loss
      } | Training Accuracy: ${
        status.p_training_accuracy === 0 ? "-" : status.p_training_accuracy
      }\nTest Loss: ${
        status.p_test_loss === 0 ? "-" : status.p_test_loss
      } | Test Accuracy: ${
        status.p_test_accuracy === 0 ? "-" : status.p_test_accuracy
      }`,
    },
    {
      step: 3,
      title: "Analyze",
      description: `${
        (activeStep === 3 &&
          (progress.includes("UMAP") || progress.includes("CKA"))) ||
        (!isFirstRunning && progress === "Idle")
          ? `Computing UMAP Embedding... ${
              !progress.includes("UMAP") ? "100" : umapProgress
            }%`
          : "Computing UMAP Embedding"
      }\n${
        (activeStep === 3 && progress.includes("CKA")) ||
        (!isFirstRunning && progress === "Idle")
          ? `Calculating CKA Similarity... ${
              progress === "Idle" ? "100" : ckaProgress
            }%`
          : "Calculating CKA Similarity"
      }\n${
        !isFirstRunning && progress === "Idle"
          ? `Done! Experiment ID: ${status.recent_id}`
          : ""
      }`,
    },
  ];

  const checkStatus = useCallback(async () => {
    try {
      const unlearningStatus = await fetchUnlearningStatus();

      updateStatus(unlearningStatus);

      const progress = unlearningStatus.progress;
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

    if (progress.includes("UMAP")) {
      const startTime = Date.now();
      const duration = 10000;

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressValue = Math.min(
          Math.floor((elapsed / duration) * 100),
          100
        );

        setUmapProgress(progressValue);

        if (progressValue === 100) {
          clearInterval(intervalId!);
        }
      }, 100);
    } else if (progress.includes("CKA")) {
      const startTime = Date.now();
      const duration = 10000;

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressValue = Math.min(
          Math.floor((elapsed / duration) * 100),
          100
        );

        setCkaProgress(progressValue);

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
  }, [progress]);

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
                    {state === "completed" ||
                    (!isFirstRunning && !isRunning) ? (
                      <Check className="size-4" />
                    ) : state === "active" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (isFirstRunning || isRunning) &&
                      state === "inactive" ? (
                      <Dot className="size-4" />
                    ) : null}
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
