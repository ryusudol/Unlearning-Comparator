import React, { useState, useCallback, useEffect } from "react";
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
  isLoading: boolean;
  setIsLoading: (bool: boolean) => void;
  setSvgContents: (data: string[]) => void;
};
type Timer = ReturnType<typeof setInterval> | undefined;

export default function TrainingConfiguration({
  isLoading,
  setIsLoading,
  setSvgContents,
}: PropsType) {
  const [trainingMode, setTrainingMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [model, setModel] = useState("ResNet-18");
  const [dataset, setDataset] = useState("CIFAR-10");
  const [trainingEpochs, setTrainingEpochs] = useState(0);
  const [trainingBatchSize, setTrainingBatchSize] = useState(0);
  const [trainingLearningRate, setTrainingLearningRate] = useState(0);
  const [trainingSeed, setTrainingSeed] = useState(0);
  const [trainingCustomFile, setTrainingCustomFile] = useState<File>();
  const [intervalId, setIntervalId] = useState<Timer>();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/train/status`);
      const data = await res.json();
      if (!data.is_training) {
        clearInterval(intervalId);
        setIntervalId(undefined);
        setIsLoading(false);
        const res = await fetch(`${API_URL}/train/result`);
        if (!res.ok) {
          alert("Error occurred while fetching the training result.");
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setSvgContents(data.svg_files);
      }
    } catch (err) {
      console.log(err);
    }
  }, [intervalId, setIsLoading, setSvgContents]);

  useEffect(() => {
    if (isLoading && !intervalId) {
      const id = setInterval(checkStatus, 1000);
      setIntervalId(id);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, intervalId, checkStatus]);

  const handlePredefinedClick = () => {
    setTrainingMode(0);
  };

  const handleCustomClick = () => {
    setTrainingMode(1);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.currentTarget.files
      ? e.currentTarget.files[0]
      : null;
    if (!uploadedFile) return;
    setTrainingCustomFile(uploadedFile);
  };

  const handleRunBtnClick = async () => {
    setIsLoading(true);
    try {
      if (
        trainingSeed === 0 ||
        trainingBatchSize === 0 ||
        trainingLearningRate === 0 ||
        trainingEpochs === 0
      ) {
        alert("Please enter valid numbers");
        setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
      const json = await res.json();
      console.log(json);
      // TODO: 모달창에 Training Started . . .
    } catch (err) {
      console.log(err);
      setIsLoading(false);
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
            <div>
              <FontAwesomeIcon
                className={styles.icon}
                icon={trainingMode ? faCircle : faCircleCheck}
              />
              <span>Predefined</span>
            </div>
          </div>
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
        <div
          id="training-custom"
          onClick={handleCustomClick}
          className={styles.custom}
        >
          <div>
            <FontAwesomeIcon
              className={styles.icon}
              icon={trainingMode ? faCircleCheck : faCircle}
            />
            <span>Custom</span>
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
