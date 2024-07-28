import React, {
  useReducer,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import styles from "./TrainingConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import Input from "../components/Input";
import {
  initialState,
  configurationReducer,
} from "../reducers/trainingReducer";
import { Status, Props, Timer } from "../types/training_config";

const API_URL = "http://localhost:8000";
const MODELS = ["ResNet-18", "ResNet-34"];
const DATASET = ["CIFAR-10", "VggFace"];

export default function TrainingConfiguration({
  setTrainedModels,
  setOriginalSvgContents,
}: Props) {
  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [isLoading, setIsLoading] = useState<0 | 1 | 2>(0); // 0: Idle, 1: Training, 2: Inferencing
  const [statusMsg, setStatusMsg] = useState("Training . . .");
  const [statusDetail, setStatusDetail] = useState<Status | undefined>();
  const [trainingCustomFile, setTrainingCustomFile] = useState<File>();

  const [state, dispatch] = useReducer(configurationReducer, initialState);

  const trainIntervalIdRef = useRef<Timer>();
  const inferenceIntervalIdRef = useRef<Timer>();
  const resultFetchedRef = useRef(false);

  const checkTrainStatus = useCallback(async () => {
    if (resultFetchedRef.current) return;
    try {
      const res = await fetch(`${API_URL}/train/status`);
      const data = await res.json();
      setStatusDetail(data);
      if (data.progress === 100) setStatusMsg("Embedding . . .");
      if (!data.is_training && !resultFetchedRef.current) {
        resultFetchedRef.current = true;
        if (trainIntervalIdRef.current) {
          clearInterval(trainIntervalIdRef.current);
          trainIntervalIdRef.current = undefined;
        }
        const resultRes = await fetch(`${API_URL}/train/result`);
        if (!resultRes.ok) {
          alert("Error occurred while fetching the training result.");
          return;
        }
        const data = await resultRes.json();
        setOriginalSvgContents(data.svg_files);
        setIsLoading(0);
        setStatusDetail(undefined);
        const trainedModelsRes = await fetch(`${API_URL}/trained_models`);
        if (!trainedModelsRes.ok) {
          alert("Error occurred while fetching trained models.");
          return;
        }
        const trainedModels = await trainedModelsRes.json();
        setTrainedModels(trainedModels);
      }
    } catch (err) {
      console.log(err);
    }
  }, [setOriginalSvgContents, setTrainedModels]);

  const checkInferenceStatus = useCallback(async () => {
    if (resultFetchedRef.current) return;
    try {
      const res = await fetch(`${API_URL}/inference/status`);
      const data = await res.json();
      if (!data.is_inferencing && !resultFetchedRef.current) {
        resultFetchedRef.current = true;
        if (inferenceIntervalIdRef.current) {
          clearInterval(inferenceIntervalIdRef.current);
          inferenceIntervalIdRef.current = undefined;
        }
        const resultRes = await fetch(`${API_URL}/inference/result`);
        if (!resultRes.ok) {
          alert("Error occurred while fetching the inference result.");
          return;
        }
        const resultData = await resultRes.json();
        setOriginalSvgContents(resultData.svg_files);
        setIsLoading(0);
      }
    } catch (err) {
      console.log(err);
    }
  }, [setOriginalSvgContents]);

  useEffect(() => {
    if (isLoading === 1 && !trainIntervalIdRef.current) {
      trainIntervalIdRef.current = setInterval(checkTrainStatus, 1000);
    } else if (isLoading === 2 && !inferenceIntervalIdRef.current) {
      inferenceIntervalIdRef.current = setInterval(checkInferenceStatus, 5000);
    }
    return () => {
      if (trainIntervalIdRef.current) clearInterval(trainIntervalIdRef.current);
      if (inferenceIntervalIdRef.current)
        clearInterval(inferenceIntervalIdRef.current);
    };
  }, [isLoading, checkTrainStatus, checkInferenceStatus]);

  const handleSectionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "predefined") setMode(0);
    else if (id === "custom") setMode(1);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files.length > 0)
      setTrainingCustomFile(e.currentTarget.files[0]);
  };

  const handleBtnClick = async () => {
    if (isLoading === 1) {
      try {
        setStatusMsg("Cancelling the training...");
        const res = await fetch(`${API_URL}/train/cancel`, { method: "POST" });
        if (!res.ok) {
          alert("Error occurred while cancelling the training.");
          return;
        }
        resultFetchedRef.current = true;
        setIsLoading(0);
      } catch (err) {
        console.error(err);
      }
    } else {
      resultFetchedRef.current = false;
      if (mode === 0) {
        if (
          state.seed === 0 ||
          state.batch_size === 0 ||
          state.learning_rate === 0 ||
          state.learning_rate === 0
        ) {
          alert("Please enter valid numbers");
          return;
        }
        setIsLoading(1);
        setStatusDetail(undefined);
        setStatusMsg("Training . . .");
        try {
          const data = {
            seed: state.seed,
            batch_size: state.batch_size,
            learning_rate: state.learning_rate,
            epochs: state.epochs,
          };
          const res = await fetch(`${API_URL}/train`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            alert("Error occurred while sending a request for training.");
            setIsLoading(0);
          }
        } catch (err) {
          console.log(err);
          setIsLoading(0);
        }
      } else {
        if (!trainingCustomFile) {
          alert("Please upload a custom training file.");
          return;
        }
        setIsLoading(2);
        try {
          setStatusMsg("Inferencing . . .");
          const formData = new FormData();
          formData.append("weights_file", trainingCustomFile);
          const res = await fetch(`${API_URL}/inference`, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            alert("Error occurred while sending a request for inference.");
            setIsLoading(0);
            return;
          }
          setTimeout(() => {
            setStatusMsg("Embedding . . .");
          }, 10000);
        } catch (err) {
          console.error(err);
          setIsLoading(0);
        }
      }
    }
  };

  return (
    <ContentBox height={232}>
      <div className={styles["subset-wrapper"]}>
        <SubTitle subtitle="Training Configuration" />
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
          {isLoading === 1 ? (
            <div className={styles["status-wrapper"]}>
              <span className={styles.status}>{statusMsg}</span>
              {statusDetail && statusDetail.current_epoch >= 1 ? (
                <div className={styles["status-detail-wrapper"]}>
                  {/* TODO: class accuracy 표시 */}
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
                value={state.model}
                dispatch={dispatch}
                optionData={MODELS}
                type="select"
              />
              <Input
                labelName="Dataset"
                value={state.dataset}
                dispatch={dispatch}
                optionData={DATASET}
                type="select"
              />
              <Input
                labelName="Epochs"
                value={state.epochs}
                dispatch={dispatch}
                type="number"
              />
              <Input
                labelName="Batch Size"
                value={state.batch_size}
                dispatch={dispatch}
                type="number"
              />
              <Input
                labelName="Learning Rate"
                value={state.learning_rate}
                dispatch={dispatch}
                type="number"
              />
              <Input
                labelName="Seed"
                value={state.seed}
                dispatch={dispatch}
                type="number"
              />
            </div>
          )}
        </div>
        <div id="custom" onClick={handleSectionClick} className={styles.custom}>
          <div className={styles["label-wrapper"]}>
            <FontAwesomeIcon
              className={styles.icon}
              icon={mode ? faCircleCheck : faCircle}
            />
            <span className={styles["predefined-label"]}>Custom Model</span>
          </div>
          {isLoading === 2 ? (
            <span className={styles["infer-status"]}>{statusMsg}</span>
          ) : (
            <div>
              <label htmlFor="custom-training">
                {trainingCustomFile ? (
                  <div className={styles["upload"]}>
                    <span className={styles["upload-text"]}>
                      {trainingCustomFile.name}
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
          )}
        </div>
      </div>
      <div className={styles["button-wrapper"]}>
        <div onClick={handleBtnClick} className={styles.button}>
          {isLoading === 1 ? "Cancel" : "Run"}
        </div>
      </div>
    </ContentBox>
  );
}
