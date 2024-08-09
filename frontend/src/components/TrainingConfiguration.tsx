import React, { useState, useCallback, useRef } from "react";
import styles from "./TrainingConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import Input from "../components/Input";
import OperationStatus from "./OperationStatus";
import { useInterval } from "../hooks/useInterval";
import { MODELS, DATASET } from "../constants/training";
import { execute, monitorStatus } from "../http";
import {
  TrainingStatus,
  TrainingConfigurationData,
  TrainingProps,
  Timer,
} from "../types/settings";

const initialState = {
  model: "ResNet-18",
  dataset: "CIFAR-10",
  epochs: 30,
  learning_rate: 0.01,
  batch_size: 128,
  seed: 1,
};

export default function TrainingConfiguration({
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

  return operationStatus ? (
    <OperationStatus indicator={indicator} status={status} />
  ) : (
    <form onSubmit={handleBtnClick}>
      <div className={styles["subset-wrapper"]}>
        <div
          id="predefined"
          onClick={handleSectionClick}
          className={styles.predefined}
        >
          <div className={styles.mode}>
            <div className={styles["label-wrapper"]}>
              <FontAwesomeIcon
                className={styles.icon}
                icon={mode ? faCircle : faCircleCheck}
              />
              <span className={styles["predefined-label"]}>
                Predefined Settings
              </span>
            </div>
          </div>
          <div>
            <Input
              labelName="Model"
              defaultValue={initialState.model}
              optionData={MODELS}
              type="select"
            />
            <Input
              labelName="Dataset"
              defaultValue={initialState.dataset}
              optionData={DATASET}
              type="select"
            />
            <Input
              labelName="Epochs"
              defaultValue={initialState.epochs}
              type="number"
            />
            <Input
              labelName="Learning Rate"
              defaultValue={initialState.learning_rate}
              type="number"
            />
            <Input
              labelName="Batch Size"
              defaultValue={initialState.batch_size}
              type="number"
            />
            <Input
              labelName="Seed"
              defaultValue={initialState.seed}
              type="number"
            />
          </div>
        </div>
        <div id="custom" onClick={handleSectionClick} className={styles.custom}>
          <div className={styles["label-wrapper"]}>
            <FontAwesomeIcon
              className={styles.icon}
              icon={mode ? faCircleCheck : faCircle}
            />
            <span className={styles["predefined-label"]}>Custom Model</span>
          </div>
          <div>
            <label htmlFor="custom-training">
              {customFile ? (
                <div className={styles["upload"]}>
                  <span className={styles["upload-text"]}>
                    {customFile.name}
                  </span>
                </div>
              ) : (
                <div className={styles["upload"]}>Click to upload</div>
              )}
            </label>
            <input
              onChange={handleCustomFileUpload}
              className={styles["file-input"]}
              type="file"
              id="custom-training"
            />
          </div>
        </div>
      </div>
      <div className={styles["button-wrapper"]}>
        <button className={styles.button}>
          {operationStatus ? "Cancel" : "Run"}
        </button>
      </div>
    </form>
  );
}
