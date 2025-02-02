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

const CUSTOM = "custom";

export default function UnlearningConfiguration() {
  const { updateIsRunning, initStatus, updateActiveStep } =
    useContext(RunningStatusContext);

  const { forgetClassNumber } = useForgetClass();

  const [isDisabled, setIsDisabled] = useState(false);
  const [epochs, setEpochs] = useState<number | "">(10);
  const [learningRate, setLearningRate] = useState<string>("0.01");
  const [batchSize, setBatchSize] = useState<number | "">(64);
  const [method, setMethod] = useState("ft");
  const [selectedFileName, setSelectedFileName] = useState("No file chosen");

  useEffect(() => {
    if (epochs === "" || learningRate === "" || batchSize === "") {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [batchSize, epochs, learningRate]);

  const isCustom = method === CUSTOM;

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

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.currentTarget;
    if (value === "") {
      if (id === "epochs") setEpochs("");
      else if (id === "learningRate") setLearningRate("");
      else if (id === "batchSize") setBatchSize("");
      return;
    }

    if (id === "epochs") {
      const numericValue = Math.min(Math.max(Number(value), 1), 20);
      setEpochs(numericValue);
    } else if (id === "learningRate") {
      setLearningRate(value);
    } else if (id === "batchSize") {
      const numericValue = Math.min(Math.max(Number(value), 1), 512);
      setBatchSize(numericValue);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setSelectedFileName(file ? file.name : "No file chosen");
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
    const runningConfig: UnlearningConfigurationData = {
      method: config.method as string,
      forget_class: forgetClassNumber,
      epochs: epochs as number,
      learning_rate: numericLearningRate,
      batch_size: batchSize as number,
    };

    updateIsRunning(true);
    initStatus(forgetClassNumber);
    updateActiveStep(1);

    isCustom
      ? await executeCustomUnlearning(
          config.custom_file as File,
          forgetClassNumber
        )
      : await executeMethodUnlearning(runningConfig);
  };

  let configurationContent = isCustom ? (
    <CustomUnlearning fileName={selectedFileName} onChange={handleFileChange} />
  ) : (
    <MethodUnlearning
      epochs={epochs}
      learningRate={learningRate}
      batchSize={batchSize}
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
