import React, { useContext, useState, useRef, useCallback } from "react";
import styles from "./Unlearning.module.css";

import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import CustomInput from "../CustomInput";
import OperationStatus from "../OperationStatus";
import RunButton from "../RunButton";
import { BaselineContext } from "../../store/baseline-context";
import { RetrainingConfigContext } from "../../store/retraining-config-context";
import { UnlearningConfigContext } from "../../store/unlearning-config-context";
import { MetricsContext } from "../../store/metrics-context";
import { SvgsContext } from "../../store/svgs-context";
import { executeRunning, fetchRunningStatus } from "../../http";
import { getDefaultUnlearningConfig } from "../../util";
import { useInterval } from "../../hooks/useInterval";
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

export default function Unlearning({
  operationStatus,
  setOperationStatus,
  trainedModels,
  setUnlearnedModels,
}: UnlearningProps) {
  const { baseline, saveBaseline } = useContext(BaselineContext);
  const { saveRetrainingConfig } = useContext(RetrainingConfigContext);
  const { saveUnlearningConfig } = useContext(UnlearningConfigContext);
  const { saveMetrics } = useContext(MetricsContext);
  const {
    saveRetrainingSvgs,
    saveUnlearningSvgs,
    clearRetrainingSvgs,
    clearUnlearningSvgs,
  } = useContext(SvgsContext);

  const interval = useRef<Timer>();
  const fetchedResult = useRef(false);

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [forgetClass, setForgetClass] = useState(0);
  const [method, setMethod] = useState("Fine-Tuning");
  const [customFile, setCustomFile] = useState<File>();
  const [indicator, setIndicator] = useState("Unlearning . . .");
  const [status, setStatus] = useState<UnlearningStatus | undefined>();
  const [initialState, setInitialState] = useState(initialValue);

  const isRetrain = method === "Retrain";
  const isBaselineSelected = baseline === -1;

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
      saveMetrics
    );
  }, [
    isRetrain,
    saveMetrics,
    saveRetrainingSvgs,
    saveUnlearningSvgs,
    setOperationStatus,
    setUnlearnedModels,
  ]);

  useInterval(operationStatus, interval, checkUnlearningStatus);

  const handleForgetClassSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForgetClass(+e.currentTarget.value);
  };

  const handleBaselineSet = () => {
    saveBaseline(forgetClass);
  };

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
    if (!isBaselineSelected) {
      const id = e.currentTarget.id;
      if (id === "predefined") setMode(0);
      else if (id === "custom") setMode(1);
    }
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

    console.log(configState);

    if (isRetrain) {
      saveRetrainingConfig({
        epochs: configState.epochs,
        learningRate: configState.learning_rate,
        batchSize: configState.batch_size,
        forgetClass: configState.forget_class,
      });
      clearRetrainingSvgs();
    } else {
      saveUnlearningConfig({
        method,
        trainedModel: configState.trained_model,
        epochs: configState.epochs,
        learningRate: configState.learning_rate,
        batchSize: configState.batch_size,
        forgetClass: configState.forget_class,
      });
      clearUnlearningSvgs();
    }

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
          <div className={styles.forget}>
            <select
              onChange={handleForgetClassSelect}
              name="forget_class"
              id="forget-class"
            >
              {UNLEARN_CLASSES.map((el, idx) => (
                <option key={idx} value={el}>
                  Forget Class {el}
                </option>
              ))}
            </select>
            <div onClick={handleBaselineSet}>Set Baseline</div>
          </div>
          <div
            id="predefined"
            onClick={handleSectionClick}
            className={styles.predefined}
          >
            <PredefinedInput
              mode={mode}
              handleMethodSelection={handleUnlearningMethodSelection}
              optionData={UNLEARNING_METHODS}
              disabled={isBaselineSelected}
            />
            <div>
              <Input
                labelName="Trained Model"
                defaultValue={trainedModels[0]}
                optionData={trainedModels}
                type="select"
                disabled={isBaselineSelected}
              />
              <Input
                key={initialState.epochs}
                labelName="Epochs"
                defaultValue={initialState.epochs}
                type="number"
                disabled={isBaselineSelected}
              />
              <Input
                key={initialState.batch_size}
                labelName="Batch Size"
                defaultValue={initialState.batch_size}
                type="number"
                disabled={isBaselineSelected}
              />
              <Input
                key={initialState.learning_rate}
                labelName="Learning Rate"
                defaultValue={initialState.learning_rate}
                type="number"
                disabled={isBaselineSelected}
              />
            </div>
          </div>
          <div id="custom" onClick={handleSectionClick}>
            <CustomInput
              mode={mode}
              customFile={customFile}
              handleCustomFileUpload={handleCustomFileUpload}
              disabled={isBaselineSelected}
            />
          </div>
        </div>
      )}
      <RunButton
        operationStatus={operationStatus}
        disabled={isBaselineSelected}
      />
    </form>
  );
}
