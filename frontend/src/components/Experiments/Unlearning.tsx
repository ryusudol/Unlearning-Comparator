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
import { UnlearningConfigurationData } from "../../types/experiments";

const NO_FILE_CHOSEN = "No file chosen";
export const EPOCHS = "epochs";
export const LEARNING_RATE = "learningRate";
export const BATCH_SIZE = "batchSize";
const CUSTOM = "custom";

export default function UnlearningConfiguration() {
  const { updateIsRunning, initStatus, updateActiveStep } =
    useContext(RunningStatusContext);

  const { forgetClassNumber } = useForgetClass();

  const [method, setMethod] = useState("ft");
  const [epochList, setEpochList] = useState<string[]>([]);
  const [learningRateList, setLearningRateList] = useState<string[]>([]);
  const [batchSizeList, setBatchSizeList] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedFileName, setSelectedFileName] =
    useState<string>(NO_FILE_CHOSEN);

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
    setEpochList([]);
    setLearningRateList([]);
    setBatchSizeList([]);
  };

  const handlePlusClick = (id: string, value: string) => {
    if (id === EPOCHS) {
      setEpochList((prev) =>
        prev.length >= 5 || prev.includes(value) ? prev : [...prev, value]
      );
    } else if (id === LEARNING_RATE) {
      setLearningRateList((prev) =>
        prev.length >= 5 || prev.includes(value) ? prev : [...prev, value]
      );
    } else if (id === BATCH_SIZE) {
      setBatchSizeList((prev) =>
        prev.length >= 5 || prev.includes(value) ? prev : [...prev, value]
      );
    }
  };

  const handleBadgeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { id, innerHTML: target } = event.currentTarget;

    if (id === EPOCHS) {
      setEpochList((prev) => prev.filter((item) => item !== target));
    } else if (id === LEARNING_RATE) {
      setLearningRateList((prev) => prev.filter((item) => item !== target));
    } else if (id === BATCH_SIZE) {
      setBatchSizeList((prev) => prev.filter((item) => item !== target));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setSelectedFileName(file ? file.name : NO_FILE_CHOSEN);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        epochs: Number(epochList[0]),
        learning_rate: Number(learningRateList[0]),
        batch_size: Number(batchSizeList[0]),
      };
      await executeMethodUnlearning(runningConfig);
    }
  };

  let configurationContent = isCustom ? (
    <CustomUnlearning fileName={selectedFileName} onChange={handleFileChange} />
  ) : (
    <MethodUnlearning
      method={method}
      epochsList={epochList}
      learningRateList={learningRateList}
      batchSizeList={batchSizeList}
      onPlusClick={handlePlusClick}
      onBadgeClick={handleBadgeClick}
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
