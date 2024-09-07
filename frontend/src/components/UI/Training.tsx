import React, { useCallback, useRef, useContext, useEffect } from "react";
import { Button } from "./button";

import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import OperationStatus from "../OperationStatus";
import { MODELS, DATASET } from "../../constants/training";
import { RunningStatusContext } from "../../store/running-status-context";
import {
  fetchRunningStatus,
  cancelRunning,
  fetchModelFiles,
} from "../../https/utils";
import { TrainingConfigurationData } from "../../types/settings";
import { executeTraining } from "../../https/training";

export interface TrainingProps {
  setTrainedModels: (models: string[]) => void;
}

export default function Training({ setTrainedModels }: TrainingProps) {
  const {
    isRunning,
    indicator,
    status,
    initRunningStatus,
    saveRunningStatus,
    updateIsRunning,
    updateStatus,
  } = useContext(RunningStatusContext);

  const isRunningRef = useRef<boolean>(isRunning);
  const indicatorRef = useRef<string>(indicator);
  const statusRef = useRef(status);
  const isResultFetched = useRef<boolean>(false);

  useEffect(() => {
    isRunningRef.current = isRunning;
    indicatorRef.current = indicator;
    statusRef.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkStatus = useCallback(async () => {
    if (isResultFetched.current) return;

    try {
      const trainingStatus = await fetchRunningStatus("train");

      if (isRunningRef.current !== trainingStatus.is_unlearning)
        updateIsRunning(trainingStatus.is_unlearning);
      if (statusRef.current?.progress !== trainingStatus.progress)
        updateStatus(trainingStatus);

      if (
        !isResultFetched.current &&
        trainingStatus.progress === 100 &&
        "is_training" in trainingStatus &&
        !trainingStatus.is_training
      ) {
        isResultFetched.current = true;

        const models = await fetchModelFiles("trained_models");

        setTrainedModels(models);

        alert("A trained model has been saved.");
        initRunningStatus();
      }
    } catch (error) {
      console.error("Failed to fetch unlearning status or reuslt:", error);
      initRunningStatus();
      throw error;
    }
  }, [initRunningStatus, setTrainedModels, updateIsRunning, updateStatus]);

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
  }, [isRunning, checkStatus]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as TrainingConfigurationData;

    isResultFetched.current = false;

    if (isRunning) {
      saveRunningStatus({
        isRunning: true,
        indicator: "Cancelling . . .",
        status: undefined,
      });

      await cancelRunning("train");

      initRunningStatus();
    } else {
      const isValid =
        configState.seed > 0 &&
        configState.epochs > 0 &&
        configState.batch_size > 0 &&
        configState.learning_rate > 0;

      if (!isValid) {
        alert("Please enter valid numbers.");
        return;
      }

      saveRunningStatus({
        isRunning: true,
        indicator: "Training . . .",
        status: undefined,
      });

      await executeTraining(configState);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isRunning ? (
        <OperationStatus
          identifier="training"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <PredefinedInput mode={0} />
          <div>
            <Input
              labelName="Model"
              defaultValue={"ResNet18"}
              optionData={MODELS}
            />
            <Input
              labelName="Dataset"
              defaultValue={"CIFAR-10"}
              optionData={DATASET}
            />
            <Input labelName="Epochs" defaultValue={30} />
            <Input labelName="Learning Rate" defaultValue={0.01} />
            <Input labelName="Batch Size" defaultValue={128} />
            <Input labelName="Seed" defaultValue={1} />
          </div>
        </div>
      )}
      <Button className="w-12 h-6 text-[14px] text-[#fefefe] absolute bottom-[10px] left-[262px]">
        {isRunning ? "Cancel" : "Run"}
      </Button>
    </form>
  );
}
