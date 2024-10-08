import React, {
  useEffect,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { Button } from "./ui/button";

import Input from "./Input";
import CustomInput from "./CustomInput";
import PredefinedInput from "./PredefinedInput";
import OperationStatus from "./OperationStatus";
import { OverviewContext } from "../store/overview-context";
import { RunningStatusContext } from "../store/running-status-context";
import { getDefaultUnlearningConfig } from "../util";
import { OverviewItem } from "../types/overview-context";
import { cancelRunning, fetchRunningStatus } from "../https/utils";
import { MultiplicationSignIcon } from "./ui/icons";
import { UNLEARNING_METHODS } from "../constants/unlearning";
import { forgetClasses } from "../constants/forgetClasses";
import {
  UnlearningConfigurationData,
  // ResultType,
  UnlearningStatus,
} from "../types/settings";
import {
  executeCustomUnlearning,
  executePredefinedUnlearning,
  // fetchUnlearningResult,
} from "../https/unlearning";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const initialValue = {
  method: "Fine-Tuning",
  forget_class: "0",
  epochs: 10,
  learning_rate: 0.02,
  batch_size: 128,
};

export interface UnlearningProps {
  trainedModels: string[];
  setUnlearnedModels: (models: string[]) => void;
}

export default function Unlearning({
  trainedModels,
  setUnlearnedModels,
}: UnlearningProps) {
  const { overview, saveOverview, deleteLastOverviewItem } =
    useContext(OverviewContext);
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

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [method, setMethod] = useState("Fine-Tuning");
  const [customFile, setCustomFile] = useState<File>();
  const [initialState, setInitialState] = useState(initialValue);

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

  const handleUnlearningMethodSelection = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedMethod = e.currentTarget.value;
    const { epochs, learning_rate } =
      getDefaultUnlearningConfig(selectedMethod);

    setInitialState({
      ...initialState,
      method: selectedMethod,
      epochs,
      learning_rate,
    });
  };

  const handleSectionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "predefined") setMode(0);
    else if (id === "custom") setMode(1);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files.length > 0)
      setCustomFile(e.currentTarget.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    if (isRetrain) fd.delete("method");

    type ConfigurationData = typeof isRetrain extends true
      ? Omit<UnlearningConfigurationData, "method">
      : UnlearningConfigurationData;

    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as ConfigurationData;

    const newOverviewItem: OverviewItem = {
      forget_class: configState.forget_class,
      model: "ResNet18",
      dataset: configState.dataset === "CIFAR-10" ? "CIFAR-10" : "VggFace",
      training: !isRetrain && mode === 0 ? configState.trained_model : "None",
      unlearning: isRetrain
        ? "Retrain"
        : mode === 0
        ? configState.method
        : `Custom - ${customFile!.name}`,
      defense: "None",
      epochs: configState.epochs,
      learning_rate: configState.learning_rate,
      batch_size: configState.batch_size,
      ua: 0,
      ra: 0,
      tua: 0,
      tra: 0,
      rte: 0,
      train_class_accuracies: {},
      test_class_accuracies: {},
    };

    const newOverview = [...overview, newOverviewItem];

    saveOverview({ overview: newOverview });

    isResultFetched.current = false;

    if (isRunning) {
      saveRunningStatus({
        isRunning: true,
        indicator: "Cancelling . . .",
        status: undefined,
      });

      await cancelRunning("unlearn");

      deleteLastOverviewItem();
      initRunningStatus();
    } else {
      const isValid =
        mode === 0
          ? configState.epochs > 0 &&
            configState.batch_size > 0 &&
            configState.learning_rate > 0
          : !!customFile;

      if (!isValid) {
        alert(
          mode === 0
            ? "Please enter valid numbers."
            : "Please upload a custom file."
        );
        return;
      }

      saveRunningStatus({
        isRunning: true,
        indicator: `Unlearning Class ${configState.forget_class} . . .`,
        status: undefined,
      });

      await (mode === 0
        ? executePredefinedUnlearning(configState)
        : executeCustomUnlearning(customFile!, configState.forget_class));
    }

    setInitialState(initialState);
    setMethod("Fine-Tuning");
    setCustomFile(undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      {isRunning ? (
        <OperationStatus
          identifier="unlearning"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <div id="forget-class" className="flex justify-between items-center">
            <div className="flex items-center">
              <MultiplicationSignIcon className="scale-125 -ml-[2px] mr-[2px]" />
              <label className="text-[15px]" htmlFor="forget_class">
                Forget Class
              </label>
            </div>
            <Select defaultValue={forgetClasses[0]} name="forget_class">
              <SelectTrigger className="w-[130px] h-[19px] bg-white text-black pl-2 pr-1 text-[13px]">
                <SelectValue placeholder={forgetClasses[0]} />
              </SelectTrigger>
              <SelectContent className="bg-white text-black overflow-ellipsis whitespace-nowrap">
                {forgetClasses.map((forgetClass, idx) => (
                  <SelectItem
                    key={idx}
                    value={forgetClass}
                    className="text-[13px]"
                  >
                    {forgetClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div id="predefined" onClick={handleSectionClick}>
            <PredefinedInput
              mode={mode}
              handleMethodSelection={handleUnlearningMethodSelection}
              optionData={UNLEARNING_METHODS}
            />
            <div>
              <Input
                labelName="Trained Model"
                defaultValue={trainedModels[0]}
                optionData={trainedModels}
                disabled={isRetrain}
              />
              <Input
                key={initialState.epochs}
                labelName="Epochs"
                defaultValue={initialState.epochs}
              />
              <Input
                key={initialState.learning_rate}
                labelName="Learning Rate"
                defaultValue={initialState.learning_rate}
              />
              <Input
                key={initialState.batch_size}
                labelName="Batch Size"
                defaultValue={initialState.batch_size}
              />
            </div>
          </div>
          <div id="custom" onClick={handleSectionClick}>
            <CustomInput
              mode={mode}
              handleCustomFileUpload={handleCustomFileUpload}
            />
          </div>
        </div>
      )}
      <Button className="w-12 h-6 text-[14px] text-[#fefefe] absolute bottom-[14px] left-[262px]">
        {isRunning ? "Cancel" : "Run"}
      </Button>
    </form>
  );
}
