import React, { useState, useCallback, useEffect, useRef } from "react";
import styles from "./TrainingConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import Input from "../components/Input";

const MODELS = ["ResNet-18"];
const DATASETS = ["CIFAR-10", "MNIST"];

const API_URL = "http://localhost:8000";

type PropsType = {
  setSvgContents: (data: string[]) => void;
};
type Timer = ReturnType<typeof setInterval> | undefined;
type StatusType = {
  is_training: boolean;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  best_loss: number;
  current_accuracy: number;
  best_accuracy: number;
  estimated_time_remaining: number;
};

export default function TrainingConfiguration({ setSvgContents }: PropsType) {
  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [isTraining, setIsTraining] = useState(false);
  const [status, setStatus] = useState("Training . . .");
  const [statusDetail, setStatusDetail] = useState<StatusType | undefined>();

  const [model, setModel] = useState("ResNet-18");
  const [dataset, setDataset] = useState("CIFAR-10");
  const [trainingEpochs, setTrainingEpochs] = useState(0);
  const [trainingBatchSize, setTrainingBatchSize] = useState(0);
  const [trainingLearningRate, setTrainingLearningRate] = useState(0);
  const [trainingSeed, setTrainingSeed] = useState(0);
  const [trainingCustomFile, setTrainingCustomFile] = useState<File>();

  const intervalIdRef = useRef<Timer>();
  const resultFetchedRef = useRef(false);

  const checkStatus = useCallback(async () => {
    if (resultFetchedRef.current) return;
    try {
      const res = await fetch(`${API_URL}/train/status`);
      const data = await res.json();
      setStatusDetail(data);
      if (data.progress === 100) setStatus("Embedding . . .");
      if (!data.is_training && !resultFetchedRef.current) {
        resultFetchedRef.current = true;
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = undefined;
        }
        const resultRes = await fetch(`${API_URL}/train/result`);
        if (!resultRes.ok) {
          alert("Error occurred while fetching the training result.");
          return;
        }
        const data = await resultRes.json();
        setSvgContents(data.svg_files);
        setIsTraining(false);
        setStatusDetail(undefined);
      }
    } catch (err) {
      console.log(err);
    }
  }, [setSvgContents]);

  useEffect(() => {
    if (isTraining && !intervalIdRef.current) {
      intervalIdRef.current = setInterval(checkStatus, 1000);
    }
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [isTraining, checkStatus]);

  const handlePredefinedClick = () => {
    setMode(0);
  };

  const handleCustomClick = () => {
    setMode(1);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.currentTarget.files
      ? e.currentTarget.files[0]
      : null;
    if (!uploadedFile) return;
    setTrainingCustomFile(uploadedFile);
  };

  const handleRunBtnClick = async () => {
    resultFetchedRef.current = false;
    setIsTraining(true);
    setStatus("Training . . .");
    try {
      if (
        trainingSeed === 0 ||
        trainingBatchSize === 0 ||
        trainingLearningRate === 0 ||
        trainingEpochs === 0
      ) {
        alert("Please enter valid numbers");
        setIsTraining(false);
        return;
      }
      const data = {
        seed: trainingSeed,
        batch_size: trainingBatchSize,
        learning_rate: trainingLearningRate,
        epochs: trainingEpochs,
      };
      const res = await fetch(`${API_URL}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        alert("Error occurred while sending a request for training.");
        setIsTraining(false);
      }
    } catch (err) {
      console.log(err);
      setIsTraining(false);
    }
  };

  return (
    <ContentBox height={236}>
      <div className={styles["subset-wrapper"]}>
        <SubTitle subtitle="Training Configuration" />
        <div
          id="training-predefined"
          onClick={handlePredefinedClick}
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
          {isTraining ? (
            <div className={styles["status-wrapper"]}>
              <span className={styles.status}>{status}</span>
              {statusDetail && statusDetail.current_epoch >= 1 ? (
                <div className={styles["status-detail-wrapper"]}>
                  <span className={styles["status-detail"]}>
                    Epoch: {statusDetail.current_epoch}/
                    {statusDetail.total_epochs}
                  </span>
                  <span className={styles["status-detail"]}>
                    Current Loss: {statusDetail.current_loss.toFixed(3)}
                  </span>
                  <span className={styles["status-detail"]}>
                    Best Loss: {statusDetail.best_loss.toFixed(3)}
                  </span>
                  <span className={styles["status-detail"]}>
                    Current Accuracy: {statusDetail.current_accuracy}
                  </span>
                  <span className={styles["status-detail"]}>
                    Best Accuracy: {statusDetail.best_accuracy}
                  </span>
                  <span className={styles["status-detail"]}>
                    ETA: {statusDetail.estimated_time_remaining.toFixed(2)}s
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <Input
                labelName="Model"
                value={model}
                setStateString={setModel}
                optionData={MODELS}
                type="select"
              />
              <Input
                labelName="Dataset"
                value={dataset}
                setStateString={setDataset}
                optionData={DATASETS}
                type="select"
              />
              <Input
                labelName="Epochs"
                value={trainingEpochs}
                setStateNumber={setTrainingEpochs}
                type="number"
              />
              <Input
                labelName="Batch Size"
                value={trainingBatchSize}
                setStateNumber={setTrainingBatchSize}
                type="number"
              />
              <Input
                labelName="Learning Rate"
                value={trainingLearningRate}
                setStateNumber={setTrainingLearningRate}
                type="number"
              />
              <Input
                labelName="Seed"
                value={trainingSeed}
                setStateNumber={setTrainingSeed}
                type="number"
              />
            </div>
          )}
        </div>
        <div
          id="training-custom"
          onClick={handleCustomClick}
          className={styles.custom}
        >
          <div className={styles["label-wrapper"]}>
            <FontAwesomeIcon
              className={styles.icon}
              icon={mode ? faCircleCheck : faCircle}
            />
            <span className={styles["predefined-label"]}>Custom Model</span>
          </div>
          <label htmlFor="custom-training">
            <div className={styles["upload-btn"]}>Click to upload</div>
          </label>
          <input
            onChange={handleCustomFileUpload}
            className={styles["file-input"]}
            type="file"
            id="custom-training"
          />
        </div>
      </div>
      <div
        onClick={handleRunBtnClick}
        id="training-run"
        className={styles["button-wrapper"]}
      >
        Run
      </div>
    </ContentBox>
  );
}
