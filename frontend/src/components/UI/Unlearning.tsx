import React, { useContext, useState, useRef, useCallback } from "react";
import styles from "./Unlearning.module.css";

import ForgetClassSelector from "../ForgetClassSelector";
import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import CustomInput from "../CustomInput";
import OperationStatus from "../OperationStatus";
import RunButton from "../RunButton";
import { OverviewContext } from "../../store/overview-context";
import { SvgsContext } from "../../store/svgs-context";
import { BaselineContext } from "../../store/baseline-context";
import { executeRunning, fetchRunningStatus } from "../../http";
import { getDefaultUnlearningConfig } from "../../util";
import { useInterval } from "../../hooks/useInterval";
import { UNLEARNING_METHODS } from "../../constants/unlearning";
import {
  UnlearningStatus,
  Timer,
  UnlearningConfigurationData,
} from "../../types/settings";
import { OverviewItem } from "../../types/overview-context";
import { SelectedIDContext } from "../../store/selected-id-context";

const initialValue = {
  method: "Fine-Tuning",
  forget_class: "0",
  epochs: 10,
  learning_rate: 0.02,
  batch_size: 128,
};

export interface UnlearningProps {
  operationStatus: number;
  setOperationStatus: (val: 0 | 1 | 2) => void;
  trainedModels: string[];
  setUnlearnedModels: (models: string[]) => void;
}

export default function Unlearning({
  operationStatus,
  setOperationStatus,
  trainedModels,
  setUnlearnedModels,
}: UnlearningProps) {
  const { saveOverview, retrieveOverview } = useContext(OverviewContext);
  const { saveRetrainingSvgs, saveUnlearningSvgs } = useContext(SvgsContext);
  const { selectedID } = useContext(SelectedIDContext);
  const { saveBaseline } = useContext(BaselineContext);

  const interval = useRef<Timer>();
  const fetchedResult = useRef(false);

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [method, setMethod] = useState("Fine-Tuning");
  const [customFile, setCustomFile] = useState<File>();
  const [indicator, setIndicator] = useState("Unlearning . . .");
  const [status, setStatus] = useState<UnlearningStatus | undefined>();
  const [initialState, setInitialState] = useState(initialValue);

  const isRetrain = method === "Retrain";

  const checkUnlearningStatus = useCallback(async () => {
    await fetchRunningStatus(
      "unlearn",
      fetchedResult,
      interval,
      setOperationStatus,
      setIndicator,
      setStatus,
      setUnlearnedModels,
      isRetrain ? saveRetrainingSvgs : saveUnlearningSvgs,
      saveOverview,
      retrieveOverview,
      selectedID
    );
  }, [
    isRetrain,
    retrieveOverview,
    saveOverview,
    saveRetrainingSvgs,
    saveUnlearningSvgs,
    selectedID,
    setOperationStatus,
    setUnlearnedModels,
  ]);

  useInterval(operationStatus, interval, checkUnlearningStatus);

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

    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as UnlearningConfigurationData;

    // An example of trained_model: best_train_resnet18_CIFAR10_30epochs_0.01lr.pth
    const model = configState.trained_model.split("_")[2];
    const dataset = configState.trained_model.split("_")[3];
    let newOverview: OverviewItem = {
      forgetClass: configState.forget_class,
      model: model === "resnet18" ? "ResNet-18" : "ResNet-34",
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
    };
    const savedOverview = retrieveOverview().overview;
    const overview = [...savedOverview, newOverview];
    saveOverview({ overview });
    saveBaseline(+configState.forget_class);

    await executeRunning(
      "unlearn",
      fetchedResult,
      operationStatus,
      setOperationStatus,
      setIndicator,
      mode,
      configState,
      setStatus,
      customFile
    );

    setInitialState(initialState);
    setMethod("Fine-Tuning");
    setCustomFile(undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      {operationStatus ? (
        <OperationStatus
          identifier="unlearning"
          indicator={indicator}
          status={status}
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
      <RunButton operationStatus={operationStatus} />
    </form>
  );
}
