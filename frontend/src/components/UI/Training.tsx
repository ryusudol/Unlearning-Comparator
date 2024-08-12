import React, { useState, useCallback, useRef } from "react";

import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import CustomInput from "../CustomInput";
import RunButton from "../RunButton";
import OperationStatus from "../OperationStatus";
import { useInterval } from "../../hooks/useInterval";
import { MODELS, DATASET } from "../../constants/training";
import { execute, monitorStatus } from "../../http";
import {
  TrainingStatus,
  TrainingConfigurationData,
  TrainingProps,
  Timer,
} from "../../types/settings";

export default function Training({
  operationStatus,
  setOperationStatus,
  setTrainedModels,
}: TrainingProps) {
  const interval = useRef<Timer>();
  const fetchedResult = useRef(false);

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [indicator, setIndicator] = useState("Training . . .");
  const [status, setStatus] = useState<TrainingStatus | undefined>();
  const [customFile, setCustomFile] = useState<File>();

  const checkStatus = useCallback(async () => {
    monitorStatus(
      mode === 0 ? "train" : "inference",
      fetchedResult,
      interval,
      setOperationStatus,
      setIndicator,
      setStatus,
      setTrainedModels
    );
  }, [mode, setOperationStatus, setTrainedModels]);

  useInterval(operationStatus, interval, checkStatus);

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
    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as TrainingConfigurationData;

    execute(
      "train",
      fetchedResult,
      operationStatus,
      setOperationStatus,
      setIndicator,
      mode,
      configState,
      setStatus,
      customFile
    );
  };

  return (
    <form onSubmit={handleBtnClick}>
      {operationStatus ? (
        <OperationStatus
          identifier="training"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <div id="predefined" onClick={handleSectionClick}>
            <PredefinedInput mode={mode} />
            <div>
              <Input
                labelName="Model"
                defaultValue={"ResNet-18"}
                optionData={MODELS}
                type="select"
              />
              <Input
                labelName="Dataset"
                defaultValue={"CIFAR-10"}
                optionData={DATASET}
                type="select"
              />
              <Input labelName="Epochs" defaultValue={30} type="number" />
              <Input
                labelName="Learning Rate"
                defaultValue={0.01}
                type="number"
              />
              <Input labelName="Batch Size" defaultValue={128} type="number" />
              <Input labelName="Seed" defaultValue={1} type="number" />
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
