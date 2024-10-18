import React, {
  useCallback,
  useRef,
  useContext,
  useEffect,
  useState,
} from "react";

import { Button } from "./ui/button";
import { Slider } from "../components/ui/slider";
import { AddIcon, HyperparametersIcon } from "./ui/icons";
import OperationStatus from "./OperationStatus";
import { RunningStatusContext } from "../store/running-status-context";
import { TrainingConfigurationData } from "../types/settings";
import { executeTraining } from "../https/training";
import {
  fetchRunningStatus,
  cancelRunning,
  fetchModelFiles,
} from "../https/utils";

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

  const [epochs, setEpochs] = useState([30]);
  const [learningRate, setLearningRate] = useState([0.01]);
  const [batchSize, setBatchSize] = useState([128]);

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
    <form
      className="w-full h-full flex flex-col items-start justify-between"
      onSubmit={handleSubmit}
    >
      {isRunning ? (
        <OperationStatus
          identifier="training"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <div className="flex items-center mb-2.5">
            <HyperparametersIcon className="w-3.5" />
            <p className="ml-1">Hyperparameters</p>
          </div>
          <div>
            {/* Epochs */}
            <div className="flex items-center mb-2 ml-9">
              <span>Epochs</span>
              <div className="flex items-center ml-10">
                <Slider
                  onValueChange={(value: number[]) => setEpochs(value)}
                  value={epochs}
                  defaultValue={[5]}
                  className="w-[135px] mx-2 cursor-pointer"
                  min={1}
                  max={50}
                  step={1}
                />
                <span className="w-2 text-[14px]">{epochs}</span>
              </div>
            </div>
            {/* Learning Rate */}
            <div className="flex items-center mb-2 ml-9">
              <span>Learning Rate</span>
              <div className="flex items-center">
                <Slider
                  onValueChange={(value: number[]) => setLearningRate(value)}
                  value={learningRate}
                  defaultValue={[0.01]}
                  className="w-[135px] mx-2 cursor-pointer"
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                />
                <span className="w-2 text-[14px]">{learningRate}</span>
              </div>
            </div>
            {/* Batch Size */}
            <div className="flex items-center ml-9">
              <span>Batch Size</span>
              <div className="flex items-center ml-5">
                <Slider
                  onValueChange={(value: number[]) => setBatchSize(value)}
                  value={batchSize}
                  defaultValue={[128]}
                  className="w-[135px] mx-2 cursor-pointer"
                  min={1}
                  max={1024}
                  step={2}
                />
                <span className="w-2 text-xs">{batchSize}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <Button className="w-full h-6 font-medium text-white bg-[#585858] flex items-center">
        <AddIcon className="text-white" />
        <span>{isRunning ? "Cancel" : "Run and Add Experiment"}</span>
      </Button>
    </form>
  );
}
