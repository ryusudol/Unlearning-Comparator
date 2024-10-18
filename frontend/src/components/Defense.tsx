import React, { useState, useContext, useCallback } from "react";
import { Button } from "./ui/button";

import OperationStatus from "./OperationStatus";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { DEFENSE_METHODS } from "../constants/defense";
import { AddIcon, HyperparametersIcon } from "./ui/icons";
import { DefenseConfigurationData } from "../types/settings";
import { RunningStatusContext } from "../store/running-status-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface DefenseProps {
  unlearnedModels: string[];
}

export default function Defense({ unlearnedModels }: DefenseProps) {
  const { isRunning, indicator, status } = useContext(RunningStatusContext);

  const [epochs, setEpochs] = useState([30]);
  const [learningRateLog, setLearningRateLog] = useState([-2]);
  const [learningRate, setLearningRate] = useState(0.01);
  const [batchSizeLog, setBatchSizeLog] = useState([5]);
  const [batchSize, setBatchSize] = useState([128]);

  const handleRunBtnClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as DefenseConfigurationData;

    console.log(configState);
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
      onSubmit={handleRunBtnClick}
    >
      {isRunning ? (
        <OperationStatus
          identifier="defense"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-y-1">
            {/* Initial Checkpoint */}
            <div className="flex items-center">
              <HyperparametersIcon className="w-4 mr-1" />
              <Label
                className="inline text-base text-nowrap"
                htmlFor="initial-checkpoint"
              >
                Initial Checkpoint
              </Label>
            </div>
            <Select name="initial-checkpoint">
              <SelectTrigger
                className="w-[155px] h-[25px] text-base overflow-ellipsis whitespace-nowrap"
                id="initial-checkpoint"
              >
                <SelectValue
                  placeholder={
                    unlearnedModels.length > 0
                      ? unlearnedModels[0].length > 15
                        ? unlearnedModels[0].slice(0, 15) + "..."
                        : unlearnedModels[0]
                      : ""
                  }
                />
              </SelectTrigger>
              <SelectContent defaultValue={unlearnedModels[0]}>
                {unlearnedModels.map((item, idx) => (
                  <SelectItem key={idx} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Method */}
            <div className="flex items-center mb-1">
              <HyperparametersIcon className="w-4 mr-1" />
              <Label className="text-base text-nowrap" htmlFor="method">
                Method
              </Label>
            </div>
            <Select defaultValue={DEFENSE_METHODS[0]}>
              <SelectTrigger
                className="w-[155px] h-[25px] text-base"
                id="method"
              >
                <SelectValue placeholder={DEFENSE_METHODS[0]} />
              </SelectTrigger>
              <SelectContent>
                {DEFENSE_METHODS.map((method, idx) => (
                  <SelectItem key={idx} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Hyperparameters */}
          <div>
            <div className="flex items-center mb-1">
              <HyperparametersIcon className="w-3.5" />
              <p className="ml-1">Hyperparameters</p>
            </div>
            <div className="ml-10 grid grid-cols-[auto,1fr] grid-rows-3 gap-y-2">
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
            </div>
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
