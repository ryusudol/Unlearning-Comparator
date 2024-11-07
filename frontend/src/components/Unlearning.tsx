import React, {
  useEffect,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

import Button from "./Button";
import Slider from "./Slider";
import { Input } from "./UI/input";
import { Label } from "./UI/label";
import { HyperparametersIcon, EraserIcon, PlusIcon } from "./UI/icons";
import { RunningStatusContext } from "../store/running-status-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { UNLEARNING_METHODS } from "../constants/unlearning";
import { getDefaultUnlearningConfig } from "../util";
import { cancelRunning, fetchRunningStatus } from "../https/utils";
import { UnlearningConfigurationData } from "../types/settings";
import {
  executeMethodUnlearning,
  executeCustomUnlearning,
} from "../https/unlearning";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./UI/select";

export default function Unlearning() {
  const { isRunning, updateIsRunning } = useContext(RunningStatusContext);
  const { forgetClass } = useContext(ForgetClassContext);

  const [epochs, setEpochs] = useState([10]);
  const [learningRateLog, setLearningRateLog] = useState([-2]);
  const [batchSizeLog, setBatchSizeLog] = useState([6]);
  const [method, setMethod] = useState("ft");

  const isResultFetched = useRef<boolean>(false);

  const checkStatus = useCallback(async () => {
    if (isResultFetched.current) return;

    try {
      const unlearningStatus = await fetchRunningStatus("unlearn");

      if (
        !isResultFetched.current &&
        unlearningStatus.progress === 100 &&
        "is_unlearning" in unlearningStatus &&
        !unlearningStatus.is_unlearning
      ) {
        isResultFetched.current = true;
      }
    } catch (error) {
      console.error("Failed to fetch unlearning status or result:", error);
      throw error;
    }
  }, []);

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
  }, [checkStatus, isRunning]);

  const handleMethodSelection = (value: string) => {
    const { epochs, learning_rate } = getDefaultUnlearningConfig(value);
    setMethod(value);
    setEpochs([epochs]);
    setLearningRateLog([learning_rate]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    const config = Object.fromEntries(fd.entries());

    const runningConfig: UnlearningConfigurationData = {
      method: config.method as string,
      forget_class: forgetClass as number,
      epochs: epochs[0],
      learning_rate: parseFloat(Math.pow(10, learningRateLog[0]).toFixed(5)),
      batch_size: Math.pow(2, batchSizeLog[0]),
    };

    isResultFetched.current = false;

    updateIsRunning(true);

    if (isRunning) {
      await cancelRunning("unlearn");
    } else {
      method === "custom"
        ? await executeCustomUnlearning(
            config.custom_file as File,
            forgetClass as number
          )
        : await executeMethodUnlearning(runningConfig);
    }
  };

  return (
    <form
      className="w-full h-full flex flex-col items-start justify-between"
      onSubmit={handleSubmit}
    >
      <div className="w-full grid grid-cols-2 gap-y-2">
        <div className="flex items-center mb-1">
          <EraserIcon className="w-4 h-4 mr-1 scale-110" />
          <Label className="text-base text-nowrap" htmlFor="method">
            Method
          </Label>
        </div>
        <Select
          defaultValue="ft"
          onValueChange={handleMethodSelection}
          name="method"
        >
          <SelectTrigger
            name="method"
            className="h-[25px] text-base"
            id="method"
          >
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
      {method === "custom" ? (
        <div className="flex justify-between items-center">
          <div className="flex items-center mb-1">
            <HyperparametersIcon className="w-3.5" />
            <p className="ml-1 text-nowrap">Custom File</p>
          </div>
          <Input
            type="file"
            name="custom_file"
            className="w-40 h-[25px] -mr-[3px] pt-[1px] px-1.5 cursor-pointer"
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-2">
            <HyperparametersIcon className="w-3.5 ml-[1px] mr-[5px]" />
            <p>Hyperparameters</p>
          </div>
          <div className="ml-10 grid grid-cols-[auto,1fr] grid-rows-3 gap-y-2">
            <span className="text-sm">Epochs</span>
            <Slider
              name="epochs"
              value={epochs}
              setValue={setEpochs}
              min={1}
              max={30}
              step={1}
            />
            <span className="text-sm">Learning Rate</span>
            <Slider
              name="learning_rate"
              value={learningRateLog}
              setValue={setLearningRateLog}
              min={-5}
              max={-1}
              step={1}
              displayValue={`1e${learningRateLog[0]}`}
            />
            <span className="text-sm">Batch Size</span>
            <Slider
              name="batch_size"
              setValue={setBatchSizeLog}
              value={batchSizeLog}
              min={0}
              max={9}
              step={1}
              displayValue={Math.pow(2, batchSizeLog[0])}
            />
          </div>
        </div>
      )}
      <Button
        content={
          <>
            <PlusIcon className="w-3 h-3 mr-1.5" color="white" />
            <span className="text-base">Run and Add an Experiment</span>
          </>
        }
        className="w-full flex items-center mt-4"
      />
    </form>
  );
}
