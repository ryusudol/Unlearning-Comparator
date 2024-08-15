import React, { useContext, useState, useRef, useCallback } from "react";
import styles from "./Unlearning.module.css";

import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import CustomInput from "../CustomInput";
import OperationStatus from "../OperationStatus";
import RunButton from "../RunButton";
import { RetrainConfigContext } from "../../store/retraining-config-context";
import { UnlearningConfigContext } from "../../store/unlearning-config-context";
import { MetricsContext } from "../../store/metrics-context";
import { SvgsContext } from "../../store/svgs-context";
import { useInterval } from "../../hooks/useInterval";
import { executeRunning, fetchRunningStatus } from "../../http";
import { getDefaultUnlearningConfig } from "../../util";
import {
  UNLEARNING_METHODS,
  UNLEARN_CLASSES,
} from "../../constants/unlearning";
import {
  UnlearningStatus,
  UnlearningProps,
  Timer,
  UnlearningConfigurationData,
} from "../../types/settings";

const initialValue = {
  method: "Fine-Tuning",
  forget_class: "0",
  epochs: 10,
  learning_rate: 0.02,
  batch_size: 128,
};

export default function UnlearningConfiguration({
  operationStatus,
  setOperationStatus,
  trainedModels,
  setUnlearnedModels,
}: UnlearningProps) {
  const { saveRetrainingConfig } = useContext(RetrainConfigContext);
  const { saveUnlearningConfig } = useContext(UnlearningConfigContext);
  const { saveMetrics } = useContext(MetricsContext);
  const { saveRetrainedSvgs, saveUnlearnedSvgs } = useContext(SvgsContext);

  const interval = useRef<Timer>();
  const fetchedResult = useRef(false);

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [method, setMethod] = useState("");
  const [customFile, setCustomFile] = useState<File>();
  const [indicator, setIndicator] = useState("Unlearning . . .");
  const [status, setStatus] = useState<UnlearningStatus | undefined>();
  const [initialState, setInitialState] = useState(initialValue);

  const checkUnlearningStatus = useCallback(async () => {
    fetchRunningStatus(
      "unlearn",
      fetchedResult,
      interval,
      setOperationStatus,
      setIndicator,
      setStatus,
      setUnlearnedModels,
      method === "Retrain" ? saveRetrainedSvgs : saveUnlearnedSvgs,
      saveMetrics
    );
  }, [
    setOperationStatus,
    setUnlearnedModels,
    method,
    saveRetrainedSvgs,
    saveUnlearnedSvgs,
    saveMetrics,
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

  const handleBtnClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const forgetClass =
      mode === 0
        ? fd.get("predefined_forget_class")
        : fd.get("custom_forget_class");

    fd.delete("method");
    fd.delete("predefined_forget_class");
    fd.delete("custom_forget_class");

    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as UnlearningConfigurationData;

    configState.forget_class = forgetClass as string;

    method === "Retrain"
      ? saveRetrainingConfig({
          epochs: configState.epochs,
          learningRate: configState.learning_rate,
          batchSize: configState.batch_size,
          forgetClass: configState.forget_class,
        })
      : saveUnlearningConfig({
          method,
          epochs: configState.epochs,
          learningRate: configState.learning_rate,
          batchSize: configState.batch_size,
          forgetClass: configState.forget_class,
        });

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

    setInitialState(initialValue);
  };

  return (
    <form onSubmit={handleBtnClick}>
      {operationStatus ? (
        <OperationStatus
          identifier="unlearning"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
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
                disabled={initialState.method === "Retrain"}
              />
              <Input
                labelName="Predefined Forget Class"
                defaultValue={initialState.forget_class}
                optionData={UNLEARN_CLASSES}
                type="select"
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
            <div>
              <Input
                labelName="Custom Forget Class"
                defaultValue={initialState.forget_class}
                optionData={UNLEARN_CLASSES}
                type="select"
              />
            </div>
          </div>
        </div>
      )}
      <RunButton operationStatus={operationStatus} />
    </form>
  );
}
