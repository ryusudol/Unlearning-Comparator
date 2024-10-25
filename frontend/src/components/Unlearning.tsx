import React, {
  useEffect,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

import OperationStatus from "./OperationStatus";
import { Button } from "./ui/button";
import { RunningStatusContext } from "../store/running-status-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { HyperparametersIcon, StartPointIcon, EraserIcon } from "./ui/icons";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UNLEARNING_METHODS } from "../constants/unlearning";
import { getDefaultUnlearningConfig } from "../util";
import { cancelRunning, fetchRunningStatus } from "../https/utils";
import {
  executeMethodUnlearning,
  executeCustomUnlearning,
} from "../https/unlearning";
import {
  UnlearningConfigurationData,
  UnlearningStatus,
} from "../types/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface UnlearningProps {
  trainedModels: string[];
  setUnlearnedModels: (models: string[]) => void;
}

export default function Unlearning({
  trainedModels,
  setUnlearnedModels,
}: UnlearningProps) {
  const {
    isRunning,
    indicator,
    status,
    initRunningStatus,
    updateIsRunning,
    updateIndicator,
    updateStatus,
    saveRunningStatus,
  } = useContext(RunningStatusContext);
  const { forgetClass } = useContext(ForgetClassContext);

  const [epochs, setEpochs] = useState([10]);
  const [learningRateLog, setLearningRateLog] = useState([-2]);
  const [batchSizeLog, setBatchSizeLog] = useState([6]);
  const [method, setMethod] = useState("ft");

  const isResultFetched = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(isRunning);
  const statusRef = useRef<UnlearningStatus | undefined>(
    status as UnlearningStatus
  );

  useEffect(() => {
    isRunningRef.current = isRunning;
    statusRef.current = status as UnlearningStatus | undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRetrain = method === "Retrain";

  const checkStatus = useCallback(async () => {
    if (isResultFetched.current) return;

    try {
      const unlearningStatus = await fetchRunningStatus("unlearn");

      if (isRunningRef.current !== unlearningStatus.is_unlearning)
        updateIsRunning(unlearningStatus.is_unlearning);
      if (statusRef.current?.progress !== unlearningStatus.progress)
        updateStatus(unlearningStatus);

      if (
        !isResultFetched.current &&
        unlearningStatus.progress === 100 &&
        "is_unlearning" in unlearningStatus &&
        !unlearningStatus.is_unlearning
      ) {
        isResultFetched.current = true;

        updateIndicator("Embedding . . .");

        // const result: ResultType = await fetchUnlearningResult();
        // const ua = result.unlearn_accuracy;
        // const ra = result.remain_accuracy;
        // const tua = result.test_unlearning_accuracy;
        // const tra = result.test_remaining_accuracy;
        // // TODO: rte 구현되면 아래 수정
        // const rte = 0;
        // const train_class_accuracies =
        //   unlearningStatus.train_class_accuracies as { [key: string]: string };
        // const test_class_accuracies =
        //   unlearningStatus.test_class_accuracies as { [key: string]: string };

        // const currOverview = overview[selectedID];
        // const remainingOverview = overview.filter(
        //   (_, idx) => idx !== selectedID
        // );
        // const updatedOverview: OverviewItem = isRetrain
        //   ? {
        //       ...currOverview,
        //       ua,
        //       ra,
        //       tua,
        //       tra,
        //       rte,
        //       train_class_accuracies,
        //       test_class_accuracies,
        //     }
        //   : {
        //       ...currOverview,
        //       ua,
        //       ra,
        //       tua,
        //       tra,
        //       rte,
        //       train_class_accuracies,
        //       test_class_accuracies,
        //     };

        // saveOverview({ overview: [...remainingOverview, updatedOverview] });
        initRunningStatus();

        // TODO: unlearning 완료 후 unlearned model 받아오기
        // const models = await fetchModelFiles("unlearned_models");
        // setModelFiles(models);
      }
    } catch (error) {
      console.error("Failed to fetch unlearning status or result:", error);
      initRunningStatus();
      throw error;
    }
  }, [updateIsRunning, updateStatus, updateIndicator, initRunningStatus]);

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

    if (isRetrain) fd.delete("method");

    const config = Object.fromEntries(fd.entries());

    const runningConfig = {
      method: config.method,
      trained_model: config.trained_model,
      forget_class: forgetClass!,
      epochs: epochs[0],
      learning_rate: parseFloat(Math.pow(10, learningRateLog[0]).toFixed(5)),
      batch_size: Math.pow(2, batchSizeLog[0]),
    };

    // const newOverviewItem: OverviewItem = {
    //   forget_class: configState.forget_class,
    //   training: !isRetrain ? configState.trained_model : "None",
    //   unlearning: isRetrain
    //     ? "Retrain"
    //     : mode === 0
    //     ? configState.method
    //     : `Custom - ${customFile!.name}`,
    //   defense: "None",
    //   epochs: configState.epochs,
    //   learning_rate: configState.learning_rate,
    //   batch_size: configState.batch_size,
    //   ua: 0,
    //   ra: 0,
    //   tua: 0,
    //   tra: 0,
    //   rte: 0,
    //   train_class_accuracies: {},
    //   test_class_accuracies: {},
    // };

    // const newOverview = [...overview, newOverviewItem];

    // saveOverview({ overview: newOverview });

    isResultFetched.current = false;

    if (isRunning) {
      saveRunningStatus({
        isRunning: true,
        indicator: "Cancelling . . .",
        status: undefined,
      });

      await cancelRunning("unlearn");

      initRunningStatus();
    } else {
      saveRunningStatus({
        isRunning: true,
        indicator: `Unlearning Class ${forgetClass} . . .`,
        status: undefined,
      });

      method === "custom"
        ? await executeCustomUnlearning(
            config.custom_file as File,
            runningConfig.forget_class
          )
        : await executeMethodUnlearning(
            runningConfig as UnlearningConfigurationData
          );
    }
  };

  return (
    <form
      className="w-full h-full flex flex-col items-start justify-between"
      onSubmit={handleSubmit}
    >
      {isRunning ? (
        <OperationStatus
          identifier="unlearning"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-y-2">
            <div className="flex items-center">
              <StartPointIcon className="w-4 h-4 mr-1" />
              <Label
                className="inline text-base text-nowrap"
                htmlFor="initial-checkpoint"
              >
                Initial Checkpoint
              </Label>
            </div>
            <Select defaultValue={trainedModels[0]} name="trained_model">
              <SelectTrigger
                className="w-40 h-[25px] text-base overflow-ellipsis whitespace-nowrap"
                id="initial-checkpoint"
              >
                {trainedModels.length > 0
                  ? trainedModels[0].length > 15
                    ? trainedModels[0].slice(0, 15) + "..."
                    : trainedModels[0]
                  : ""}
              </SelectTrigger>
              <SelectContent>
                {trainedModels.map((item, idx) => (
                  <SelectItem key={idx} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <SelectTrigger className="w-40 h-[25px] text-base" id="method">
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
            <div className="mt-1">
              <div className="flex items-center mb-1">
                <HyperparametersIcon className="w-3.5 ml-[1px] mr-[5px]" />
                <p>Hyperparameters</p>
              </div>
              <div className="ml-10 grid grid-cols-[auto,1fr] grid-rows-3 gap-y-1.5">
                <span className="text-sm">Epochs</span>
                <div className="flex items-center">
                  <Slider
                    onValueChange={(value: number[]) => setEpochs(value)}
                    value={epochs}
                    defaultValue={epochs}
                    className="w-[158px] mx-2 cursor-pointer"
                    min={1}
                    max={30}
                    step={1}
                  />
                  <span className="text-sm text-nowrap">{epochs}</span>
                </div>
                <span className="text-sm">Learning Rate</span>
                <div className="flex items-center">
                  <Slider
                    onValueChange={setLearningRateLog}
                    value={learningRateLog}
                    defaultValue={learningRateLog}
                    className="w-[158px] mx-2 cursor-pointer"
                    min={-5}
                    max={-1}
                    step={1}
                  />
                  <span className="text-sm text-nowrap">
                    1e{learningRateLog[0]}
                  </span>
                </div>
                <span className="text-sm">Batch Size</span>
                <div className="flex items-center">
                  <Slider
                    onValueChange={setBatchSizeLog}
                    value={batchSizeLog}
                    defaultValue={batchSizeLog}
                    className="w-[158px] mx-2 cursor-pointer"
                    min={0}
                    max={9}
                    step={1}
                  />
                  <span className="text-sm text-nowrap">
                    {Math.pow(2, batchSizeLog[0])}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <Button className="relative w-full h-[32px] font-medium text-white bg-[#585858] flex items-center">
        <span className="text-white mr-1 font-bold font-[roboto] text-[28px] relative top-0.5">
          +
        </span>
        <span>{isRunning ? "Cancel" : "Run and Add Experiment"}</span>
      </Button>
    </form>
  );
}
