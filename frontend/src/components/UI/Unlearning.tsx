import React, {
  useEffect,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import styles from "./Unlearning.module.css";

import Input from "../Input";
import RunButton from "../RunButton";
import CustomInput from "../CustomInput";
import PredefinedInput from "../PredefinedInput";
import OperationStatus from "../OperationStatus";
import ForgetClassSelector from "../ForgetClassSelector";
import { OverviewContext } from "../../store/overview-context";
import { BaselineContext } from "../../store/baseline-context";
import { SelectedIDContext } from "../../store/selected-id-context";
import { RunningStatusContext } from "../../store/running-status-context";
import { getDefaultUnlearningConfig } from "../../util";
import { OverviewItem } from "../../types/overview-context";
import { UNLEARNING_METHODS } from "../../constants/unlearning";
import { cancelRunning, fetchRunningStatus } from "../../https/utils";
import {
  UnlearningConfigurationData,
  ResultType,
  UnlearningStatus,
} from "../../types/settings";
import {
  executeCustomUnlearning,
  executePredefinedUnlearning,
  fetchUnlearningResult,
} from "../../https/unlearning";

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
  const { saveBaseline } = useContext(BaselineContext);
  const { selectedID, saveSelectedID } = useContext(SelectedIDContext);
  const { overview, saveOverview } = useContext(OverviewContext);
  const {
    isRunning,
    indicator,
    status,
    saveRunningStatus,
    clearRunningStatus,
  } = useContext(RunningStatusContext);

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [method, setMethod] = useState("Fine-Tuning");
  const [customFile, setCustomFile] = useState<File>();
  const [initialState, setInitialState] = useState(initialValue);

  const isResultFetched = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(isRunning);
  const indicatorRef = useRef<string>(indicator);
  const statusRef = useRef<UnlearningStatus | undefined>(
    status as UnlearningStatus
  );

  useEffect(() => {
    isRunningRef.current = isRunning;
    indicatorRef.current = indicator;
    statusRef.current = status as UnlearningStatus | undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRetrain = method === "Retrain";

  const checkStatus = useCallback(async () => {
    if (isResultFetched.current) return;

    try {
      const unlearningStatus = await fetchRunningStatus("unlearn");

      if (
        isRunningRef.current !== unlearningStatus.is_unlearning ||
        statusRef.current?.progress !== unlearningStatus.progress
      ) {
        saveRunningStatus({
          isRunning: unlearningStatus.is_unlearning,
          indicator: indicatorRef.current,
          status: unlearningStatus,
        });
      }

      if (
        !isResultFetched.current &&
        unlearningStatus.progress === 100 &&
        "is_unlearning" in unlearningStatus &&
        !unlearningStatus.is_unlearning
      ) {
        isResultFetched.current = true;

        saveRunningStatus({
          isRunning: isRunningRef.current,
          indicator: "Embedding . . .",
          status: unlearningStatus,
        });

        const result: ResultType = await fetchUnlearningResult();
        const svgs = result.svg_files;
        const ua = result.unlearn_accuracy;
        const ra = result.remain_accuracy;
        const ta = result.test_accuracy;
        // TODO: rte 수정
        const rte = 0;
        // TODO: const mia = result.mia; 추가

        const currOverview = overview[selectedID];
        const remainingOverview = overview.filter(
          (_, idx) => idx !== selectedID
        );
        const updatedOverview: OverviewItem = isRetrain
          ? {
              ...currOverview,
              ua,
              ra,
              ta,
              rte,
              retrain_svgs: svgs,
            }
          : {
              ...currOverview,
              ua,
              ra,
              ta,
              rte,
              unlearn_svgs: svgs,
            };

        // TODO: 지우기
        console.log(updatedOverview);

        saveOverview({ overview: [...remainingOverview, updatedOverview] });
        clearRunningStatus();

        // TODO: unlearning 완료 후 unlearned model 받아오기
        // const models = await fetchModelFiles("unlearned_models");
        // setModelFiles(models);
      }
    } catch (error) {
      console.error("Failed to fetch unlearning status or result:", error);
      clearRunningStatus();
      throw error;
    }
  }, [
    isRetrain,
    clearRunningStatus,
    overview,
    saveOverview,
    saveRunningStatus,
    selectedID,
  ]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunningRef.current) {
      intervalId = setInterval(checkStatus, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkStatus]);

  const handleUnlearningMethodSelection = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedMethod = e.currentTarget.value;
    setMethod(selectedMethod);
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

    const dataset = configState.trained_model?.split("_")[3];
    const newOverviewItem: OverviewItem = {
      forget_class: configState.forget_class,
      model: "ResNet18",
      dataset: dataset === "CIFAR10" ? "CIFAR-10" : "VggFace",
      unlearn: isRetrain
        ? "Retrain"
        : mode === 0
        ? configState.method
        : `Custom - ${customFile!.name}`,
      trained_model: configState.trained_model,
      defense: "-",
      epochs: configState.epochs,
      learningRate: configState.learning_rate,
      batchSize: configState.batch_size,
      ua: 0,
      ra: 0,
      ta: 0,
      mia: 0,
      avg_gap: 0,
      rte: 0,
      retrain_svgs: [],
      unlearn_svgs: [],
    };
    const newOverview = [...overview, newOverviewItem];

    saveOverview({ overview: newOverview });
    saveBaseline(+configState.forget_class);
    saveSelectedID(newOverview.length - 1);

    isResultFetched.current = false;

    if (isRunning) {
      saveRunningStatus({
        isRunning,
        indicator: "Cancelling . . .",
        status: undefined,
      });

      await cancelRunning("unlearn");
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
          indicator={indicatorRef.current}
          status={statusRef.current}
        />
      ) : (
        <div>
          <ForgetClassSelector width={265} />
          <div
            id="predefined"
            onClick={handleSectionClick}
            className={styles.predefined}
          >
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
                type="select"
                disabled={isRetrain}
              />
              <Input
                key={initialState.epochs}
                labelName="Epochs"
                defaultValue={initialState.epochs}
                type="number"
              />
              <Input
                key={initialState.batch_size}
                labelName="Batch Size"
                defaultValue={initialState.batch_size}
                type="number"
              />
              <Input
                key={initialState.learning_rate}
                labelName="Learning Rate"
                defaultValue={initialState.learning_rate}
                type="number"
              />
            </div>
          </div>
          <div id="custom" onClick={handleSectionClick}>
            <CustomInput
              mode={mode}
              customFile={customFile}
              handleCustomFileUpload={handleCustomFileUpload}
            />
          </div>
        </div>
      )}
      <RunButton isRunning={isRunning} />
    </form>
  );
}
