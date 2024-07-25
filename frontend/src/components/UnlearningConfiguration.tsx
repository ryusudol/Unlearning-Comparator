import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./UnlearningConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import Input from "../components/Input";

const UNLEARNING_METHODS = [
  "Fine-Tuning",
  "Random-Label",
  "Gradient-Ascent",
  "Fisher",
  "Retrain",
];
const UNLEARN_CLASSES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const API_URL = "http://localhost:8000";

type StatusType = {
  is_unlearning: boolean;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  best_loss: number;
  current_accuracy: number;
  best_accuracy: number;
  estimated_time_remaining: number;
  forget_class: number;
};
type Timer = ReturnType<typeof setInterval> | undefined;
type PropsType = {
  trainedModels: string[];
  setUnlearnedSvgContents: (data: string[]) => void;
};

export default function UnlearningConfiguration({
  trainedModels,
  setUnlearnedSvgContents,
}: PropsType) {
  const [mode, setMode] = useState<0 | 1>(0);
  const [isUnlearning, setIsUnlearning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedTrainedModel, setSelectedTrainedModel] = useState<
    string | undefined
  >(trainedModels[0]);
  const [unlearningMethod, setUnlearningMethod] = useState(
    UNLEARNING_METHODS[0]
  );
  const [unlearningClass, setUnlearningClass] = useState("0");
  const [unlearningBatchSize, setUnlearningBatchSize] = useState(0);
  const [unlearningRate, setUnlearningRate] = useState(0);
  const [unlearningEpochs, setUnlearningEpochs] = useState(0);
  // const [unlearningCustomFile, setUnlearningCustomFile] = useState<File>();
  const [status, setStatus] = useState("Training . . .");
  const [statusDetail, setStatusDetail] = useState<StatusType | undefined>();

  const unlearningIntervalIdRef = useRef<Timer>();
  const resultFetchedRef = useRef(false);

  const checkTrainStatus = useCallback(async () => {
    if (resultFetchedRef.current) return;
    try {
      const res = await fetch(`${API_URL}/unlearn/status`);
      const data = await res.json();
      setStatusDetail(data);
      if (!data.is_unlearning && !resultFetchedRef.current) {
        resultFetchedRef.current = true;
        if (unlearningIntervalIdRef.current) {
          clearInterval(unlearningIntervalIdRef.current);
          unlearningIntervalIdRef.current = undefined;
        }
        const resultRes = await fetch(`${API_URL}/unlearn/result`);
        if (!resultRes.ok) {
          alert("Error occurred while fetching the unlearning result.");
          return;
        }
        const data = await resultRes.json();
        setUnlearnedSvgContents(data.svg_files);
        setIsUnlearning(false);
        setStatusDetail(undefined);
      }
    } catch (err) {
      console.log(err);
    }
  }, [setUnlearnedSvgContents]);

  useEffect(() => {
    if (isUnlearning && !unlearningIntervalIdRef.current) {
      unlearningIntervalIdRef.current = setInterval(checkTrainStatus, 1000);
    }
    return () => {
      if (unlearningIntervalIdRef.current)
        clearInterval(unlearningIntervalIdRef.current);
    };
  }, [checkTrainStatus, isUnlearning]);

  const handleSelectUnlearningMethod = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.currentTarget.value;
    setUnlearningMethod(method);
  };

  const handlePredefinedClick = () => {
    setMode(0);
  };

  const handleCustomClick = () => {
    setMode(1);
  };

  const handleCancelBtnClick = async () => {
    // try {
    //   setIsCancelling(true);
    //   const res = await fetch(`${API_URL}/unlearn/cancel`, { method: "POST" });
    //   if (!res.ok) {
    //     alert("Error occurred while cancelling the unlearning.");
    //     return;
    //   }
    //   resultFetchedRef.current = true;
    //   setIsUnlearning(false);
    //   setIsCancelling(false);
    // } catch (err) {
    //   console.error(err);
    // }
  };

  const handleRunBtnClick = async () => {
    resultFetchedRef.current = false;
    if (mode === 0) {
      if (
        unlearningBatchSize === 0 ||
        unlearningRate === 0 ||
        unlearningEpochs === 0
      ) {
        alert("Please enter valid numbers");
        return;
      }
      setIsUnlearning(true);
      setStatus("Unlearning . . .");
      if (unlearningMethod === "Retrain") {
        try {
          const data = {
            batch_size: unlearningBatchSize,
            learning_rate: unlearningRate,
            epochs: unlearningEpochs,
            forget_class: unlearningClass,
          };
          const res = await fetch(`${API_URL}/unlearn/retrain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            alert("Error occurred while sending a request for retraining.");
            setIsUnlearning(false);
          }
        } catch (err) {
          console.error(err);
          setIsUnlearning(false);
        }
      }
    }
  };

  return (
    <ContentBox height={236}>
      <div className={styles["subset-wrapper"]}>
        <SubTitle subtitle="Unlearning Configuration" />
        <div
          id="unlearning-predefined"
          onClick={handlePredefinedClick}
          className={styles.predefined}
        >
          <div className={styles.mode}>
            <div className={styles["label-wrapper"]}>
              <FontAwesomeIcon
                className={styles.icon}
                icon={mode ? faCircle : faCircleCheck}
              />
              <label className={styles["predefined-label"]}>
                Predefined Model
              </label>
            </div>
            <select
              onChange={handleSelectUnlearningMethod}
              className={styles["predefined-select"]}
            >
              {UNLEARNING_METHODS.map((method, idx) => (
                <option key={idx} className={styles.option} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          {isUnlearning ? (
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
                    Current Accuracy: {statusDetail.current_accuracy.toFixed(3)}
                  </span>
                  <span className={styles["status-detail"]}>
                    Best Accuracy: {statusDetail.best_accuracy.toFixed(3)}
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
                labelName="Trained Model"
                value={selectedTrainedModel}
                setStateString={setSelectedTrainedModel}
                optionData={trainedModels}
                type="select"
                disabled={unlearningMethod === "Retrain"}
              />
              <Input
                labelName="Forget Class"
                value={unlearningClass}
                setStateString={setUnlearningClass}
                optionData={UNLEARN_CLASSES}
                type="select"
              />
              <Input
                labelName="Epochs"
                value={unlearningEpochs}
                setStateNumber={setUnlearningEpochs}
                type="number"
              />
              <Input
                labelName="Batch Size"
                value={unlearningBatchSize}
                setStateNumber={setUnlearningBatchSize}
                type="number"
              />
              <Input
                labelName="Learning Rate"
                value={unlearningRate}
                setStateNumber={setUnlearningRate}
                type="number"
              />
            </div>
          )}
        </div>
        <div
          id="unlearning-custom"
          onClick={handleCustomClick}
          className={styles["custom-wrapper"]}
        >
          <div className={styles.custom}>
            <div className={styles["label-wrapper"]}>
              <FontAwesomeIcon
                className={styles.icon}
                icon={mode ? faCircleCheck : faCircle}
              />
              <span className={styles["predefined-label"]}>Custom Model</span>
            </div>
            <label htmlFor="custom-unlearning">
              <div className={styles["upload"]}>Click to upload</div>
            </label>
            <input
              className={styles["file-input"]}
              type="file"
              id="custom-unlearning"
            />
          </div>
          <div>
            <Input
              labelName="Forget Class"
              value={unlearningClass}
              setStateString={setUnlearningClass}
              optionData={UNLEARN_CLASSES}
              type="select"
            />
          </div>
        </div>
      </div>
      <div className={styles["button-wrapper"]}>
        {isUnlearning ? (
          isCancelling ? (
            <span className={styles["cancel-msg"]}>
              Cancelling the training...
            </span>
          ) : null
        ) : // <div onClick={handleCancelBtnClick} className={styles.button}>
        //   Cancel
        // </div>
        null}
        <div
          style={{ left: `${isUnlearning ? "236px" : "236px"}` }}
          onClick={handleRunBtnClick}
          className={styles.button}
        >
          Run
        </div>
      </div>
    </ContentBox>
  );
}
