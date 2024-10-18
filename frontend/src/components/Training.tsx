import React, {
  useCallback,
  useRef,
  useContext,
  useEffect,
  useState,
} from "react";

import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
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
  const [learningRateLog, setLearningRateLog] = useState([-2]);
  const [learningRate, setLearningRate] = useState(0.01);
  const [batchSizeLog, setBatchSizeLog] = useState([5]);
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

  const handleLearningRateChange = useCallback((value: number[]) => {
    const logValue = Math.pow(10, value[0]);
    setLearningRateLog(value);
    setLearningRate(parseFloat(logValue.toFixed(5)));
  }, []);

  const handleBatchSizeChange = useCallback((value: number[]) => {
    const logValue = Math.pow(2, value[0]);
    setBatchSizeLog(value);
    setBatchSize([logValue]);
  }, []);

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
          <div className="flex items-center mb-1">
            <HyperparametersIcon className="w-3.5" />
            <p className="ml-1">Hyperparameters</p>
          </div>
          <div className="ml-10 grid grid-cols-[auto,1fr] grid-rows-4 gap-y-0.5">
            <span className="text-sm">Epochs</span>
            <div className="flex items-center">
              <Slider
                onValueChange={(value: number[]) => setEpochs(value)}
                value={epochs}
                defaultValue={[5]}
                className="w-[135px] mx-2 cursor-pointer"
                min={1}
                max={50}
                step={1}
              />
              <span className="w-2 text-sm">{epochs}</span>
            </div>
            <span className="text-sm">Learning Rate</span>
            <div className="flex items-center">
              <Slider
                onValueChange={handleLearningRateChange}
                value={learningRateLog}
                defaultValue={learningRateLog}
                className="w-[135px] mx-2 cursor-pointer"
                min={-4}
                max={-1}
                step={1}
              />
              <span className="w-2 text-sm">{learningRate}</span>
            </div>
            <span className="text-sm">Batch Size</span>
            <div className="flex items-center">
              <Slider
                onValueChange={handleBatchSizeChange}
                value={batchSizeLog}
                defaultValue={batchSizeLog}
                className="w-[135px] mx-2 cursor-pointer"
                min={0}
                max={10}
                step={1}
              />
              <span className="w-2 text-sm">{batchSize}</span>
            </div>
            <span className="text-sm">Seed</span>
            <Input
              type="number"
              defaultValue={42}
              className="h-[25px] ml-2 px-2"
            />
          </div>
        </div>
      )}
      <Button className="w-full h-7 font-medium text-white bg-[#585858] flex items-center">
        <AddIcon className="text-white" />
        <span>{isRunning ? "Cancel" : "Run and Add Experiment"}</span>
      </Button>
    </form>
  );
}
