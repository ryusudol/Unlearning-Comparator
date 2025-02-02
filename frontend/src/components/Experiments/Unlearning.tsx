import React, { useContext, useState, useEffect } from "react";

import CustomUnlearning from "./CustomUnlearning";
import MethodUnlearning from "./MethodUnlearning";
import Button from "../CustomButton";
import {
  executeMethodUnlearning,
  executeCustomUnlearning,
} from "../../utils/api/unlearning";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";
import { useForgetClass } from "../../hooks/useForgetClass";
import { Label } from "../UI/label";
import { EraserIcon, PlusIcon } from "../UI/icons";
import { RunningStatusContext } from "../../store/running-status-context";
import { UNLEARNING_METHODS } from "../../constants/experiments";
import { getDefaultUnlearningConfig } from "../../utils/config/unlearning";
import { UnlearningConfigurationData } from "../../types/experiments";

const NO_FILE_CHOSEN = "No file chosen";
const EPOCHS = "epochs";
const LEARNING_RATE = "learningRate";
const BATCH_SIZE = "batchSize";
const CUSTOM = "custom";
const CONFIG = {
  EPOCHS_MIN: 1,
  EPOCHS_MAX: 20,
  BATCH_SIZE_MIN: 1,
  BATCH_SIZE_MAX: 512,
} as const;

export default function UnlearningConfiguration() {
  const { updateIsRunning, initStatus, updateActiveStep } =
    useContext(RunningStatusContext);

  const { forgetClassNumber } = useForgetClass();

  const [method, setMethod] = useState("ft");
  const [selectedFileName, setSelectedFileName] =
    useState<string>(NO_FILE_CHOSEN);
  const [epochs, setEpochs] = useState<number | "">(10);
  const [epochList, setEpochList] = useState<number[]>([]);
  const [learningRateList, setLearningRateList] = useState<string[]>([]);
  const [batchSizeList, setBatchSizeList] = useState<number[]>([]);
  const [learningRate, setLearningRate] = useState<string>("0.01");
  const [batchSize, setBatchSize] = useState<number | "">(64);
  const [isDisabled, setIsDisabled] = useState(false);

  const isCustom = method === CUSTOM;

  useEffect(() => {
    if (
      (isCustom && selectedFileName === NO_FILE_CHOSEN) ||
      (!isCustom &&
        (epochList.length === 0 ||
          learningRateList.length === 0 ||
          batchSizeList.length === 0))
    ) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [
    batchSizeList.length,
    epochList.length,
    isCustom,
    learningRateList.length,
    selectedFileName,
  ]);

  const handleMethodChange = (method: string) => {
    setMethod(method);

    if (method !== CUSTOM) {
      const { epochs, learning_rate, batch_size } =
        getDefaultUnlearningConfig(method);

      setEpochs(epochs);
      setLearningRate(String(learning_rate));
      setBatchSize(batch_size);
    }
  };

  const handlePlusClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const id = event.currentTarget.id;
    if (id === EPOCHS && epochs !== "") {
      setEpochList((prev) =>
        prev.length >= 5 || prev.includes(epochs as number)
          ? prev
          : [...prev, epochs as number]
      );
    } else if (id === LEARNING_RATE && learningRate !== "") {
      setLearningRateList((prev) =>
        prev.length >= 5 || prev.includes(learningRate)
          ? prev
          : [...prev, learningRate]
      );
    } else if (id === BATCH_SIZE && batchSize !== "") {
      setBatchSizeList((prev) =>
        prev.length >= 5 || prev.includes(batchSize as number)
          ? prev
          : [...prev, batchSize as number]
      );
    }
  };

  const handleBadgeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const { id, innerHTML: target } = event.currentTarget;

    if (id === EPOCHS) {
      setEpochList((prev) => prev.filter((item) => item !== Number(target)));
    } else if (id === LEARNING_RATE) {
      setLearningRateList((prev) => prev.filter((item) => item !== target));
    } else if (id === BATCH_SIZE) {
      setBatchSizeList((prev) =>
        prev.filter((item) => item !== Number(target))
      );
    }
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.currentTarget;
    if (value === "") {
      if (id === EPOCHS) setEpochs("");
      else if (id === LEARNING_RATE) setLearningRate("");
      else if (id === BATCH_SIZE) setBatchSize("");
      return;
    }

    if (id === EPOCHS) {
      const numericValue = Math.min(
        Math.max(Number(value), CONFIG.EPOCHS_MIN),
        CONFIG.EPOCHS_MAX
      );
      setEpochs(numericValue);
    } else if (id === LEARNING_RATE) {
      setLearningRate(value);
    } else if (id === BATCH_SIZE) {
      const numericValue = Math.min(
        Math.max(Number(value), CONFIG.BATCH_SIZE_MIN),
        CONFIG.BATCH_SIZE_MAX
      );
      setBatchSize(numericValue);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setSelectedFileName(file ? file.name : NO_FILE_CHOSEN);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numericLearningRate = parseFloat(learningRate);
    if (numericLearningRate > 0.1 || numericLearningRate < 0.00001) {
      alert(
        "Please enter a valid number for learning rate from 0.00001 to 0.1."
      );
      return;
    }

    const fd = new FormData(e.currentTarget);
    const config = Object.fromEntries(fd.entries());

    updateIsRunning(true);
    initStatus(forgetClassNumber);
    updateActiveStep(1);

    if (isCustom) {
      await executeCustomUnlearning(
        config.custom_file as File,
        forgetClassNumber
      );
    } else {
      const runningConfig: UnlearningConfigurationData = {
        method: config.method as string,
        forget_class: forgetClassNumber,
        epochs: epochs as number,
        learning_rate: numericLearningRate,
        batch_size: batchSize as number,
      };

      await executeMethodUnlearning(runningConfig);
    }
  };

  let configurationContent = isCustom ? (
    <CustomUnlearning fileName={selectedFileName} onChange={handleFileChange} />
  ) : (
    <MethodUnlearning
      epochs={epochs}
      epochsList={epochList}
      learningRate={learningRate}
      learningRateList={learningRateList}
      batchSize={batchSize}
      batchSizeList={batchSizeList}
      onPlusClick={handlePlusClick}
      onBadgeClick={handleBadgeClick}
      onChange={handleValueChange}
    />
  );

  return (
    <form
      className="w-full h-full flex flex-col items-start justify-between"
      onSubmit={handleSubmit}
    >
      <div className="w-full grid grid-cols-2 gap-y-2">
        <div className="flex items-center mb-1">
          <EraserIcon className="w-4 h-4 mr-1 scale-110" />
          <Label className="text-base text-nowrap" htmlFor="method">
            Unlearning Method
          </Label>
        </div>
        <Select
          defaultValue="ft"
          onValueChange={handleMethodChange}
          name="method"
        >
          <SelectTrigger className="h-[25px] text-base">
            <SelectValue placeholder={UNLEARNING_METHODS[0]} />
          </SelectTrigger>
          <SelectContent>
            {UNLEARNING_METHODS.map((method, idx) => {
              const chunks = method.split("-");
              const value =
                chunks.length === 1
                  ? chunks[0].toLowerCase()
                  : (chunks[0][0] + chunks[1][0]).toLowerCase();
              return (
                <SelectItem key={idx} value={value}>
                  {method}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      {configurationContent}
      <Button className="w-full flex items-center mt-4" disabled={isDisabled}>
        <PlusIcon className="w-3 h-3 mr-1.5" color="white" />
        <span className="text-base">Run and Add an Experiment</span>
      </Button>
    </form>
  );
}
