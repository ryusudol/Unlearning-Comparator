import React, {
  useReducer,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useDispatch } from "react-redux";
import styles from "./UnlearningConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import Input from "../components/Input";
import { Status, Props, Timer } from "../types/unlearning_config";
import { Constants } from "../constants/unlearning";
import { svgsActions } from "../store/svgs";
import { Action, Configuration } from "../types/unlearning_config";

const API_URL = "http://localhost:8000";

const FINE_TUNING = "Fine-Tuning";
const RANDOM_LABEL = "Random-Label";
const GRADIENT_ASCENT = "Gradient-Ascent";
const FISHER = "Fisher";

const UPDATE_METHOD = "UPDATE_METHOD";
const UPDATE_FORGET_CLASS = "UPDATE_FORGET_CLASS";
const UPDATE_EPOCHS = "UPDATE_EPOCHS";
const UPDATE_BATCH_SIZE = "UPDATE_BATCH_SIZE";
const UPDATE_LEARNING_RATE = "UPDATE_LEARNING_RATE";

export const initialState = {
  method: FINE_TUNING,
  forget_class: "0",
  epochs: 10,
  learning_rate: 0.02,
  batch_size: 128,
};

export const unlearningConfigurationReducer = (
  state: Configuration,
  action: Action
): Configuration => {
  switch (action.type) {
    case UPDATE_METHOD:
      return { ...state, method: action.payload as string };
    case UPDATE_FORGET_CLASS:
      return { ...state, forget_class: action.payload as string };
    case UPDATE_EPOCHS:
      return { ...state, epochs: action.payload as number };
    case UPDATE_BATCH_SIZE:
      return { ...state, batch_size: action.payload as number };
    case UPDATE_LEARNING_RATE:
      return { ...state, learning_rate: action.payload as number };
    default:
      return state;
  }
};

export default function UnlearningConfiguration({
  operationStatus,
  setOperationStatus,
  trainedModels,
}: Props) {
  const dispatch = useDispatch();

  const unlearningIntervalIdRef = useRef<Timer>();
  const resultFetchedRef = useRef(false);

  const [mode, setMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [isCancelling, setIsCancelling] = useState(false);
  const [customFile, setCustomFile] = useState<File>();
  const [statusMsg, setStatusMsg] = useState("Unlearning . . .");
  const [statusDetail, setStatusDetail] = useState<Status | undefined>();
  const [trainedModel, setTrainedModel] = useState<string | undefined>(
    trainedModels[0]
  );

  const [configState, configDispatch] = useReducer(
    unlearningConfigurationReducer,
    initialState
  );

  const checkUnlearningStatus = useCallback(async () => {
    if (resultFetchedRef.current) return;
    try {
      const res = await fetch(`${API_URL}/unlearn/status`);
      const data = await res.json();
      setStatusDetail(data);
      if (data.progress === 100) setStatusMsg("Embedding . . .");
      if (!data.is_unlearning && !resultFetchedRef.current) {
        resultFetchedRef.current = true;
        if (unlearningIntervalIdRef.current) {
          clearInterval(unlearningIntervalIdRef.current);
          unlearningIntervalIdRef.current = undefined;
        }
        const resultRes = await fetch(`${API_URL}/unlearn/result`);
        console.log(resultRes);
        if (!resultRes.ok) {
          alert("Error occurred while fetching the unlearning result.");
          return;
        }
        const data = await resultRes.json();
        dispatch(svgsActions.saveUnlearnedSvgs(data.svg_files));
        setOperationStatus(0);
        setStatusDetail(undefined);
      }
    } catch (err) {
      console.log(err);
    }
  }, [dispatch, setOperationStatus]);

  useEffect(() => {
    if (operationStatus && !unlearningIntervalIdRef.current) {
      unlearningIntervalIdRef.current = setInterval(
        checkUnlearningStatus,
        5000
      );
    }
    return () => {
      if (unlearningIntervalIdRef.current)
        clearInterval(unlearningIntervalIdRef.current);
    };
  }, [checkUnlearningStatus, operationStatus]);

  const handleSelectUnlearningMethod = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.currentTarget.value;
    configDispatch({ type: UPDATE_METHOD, payload: method });
    if (method === FINE_TUNING) {
      configDispatch({ type: UPDATE_EPOCHS, payload: 10 });
      configDispatch({ type: UPDATE_LEARNING_RATE, payload: 0.02 });
      configDispatch({ type: UPDATE_BATCH_SIZE, payload: 128 });
    } else if (method === RANDOM_LABEL) {
      configDispatch({ type: UPDATE_EPOCHS, payload: 3 });
      configDispatch({ type: UPDATE_LEARNING_RATE, payload: 0.01 });
      configDispatch({ type: UPDATE_BATCH_SIZE, payload: 128 });
    } else if (method === GRADIENT_ASCENT) {
      configDispatch({ type: UPDATE_EPOCHS, payload: 3 });
      configDispatch({ type: UPDATE_LEARNING_RATE, payload: 0.0001 });
      configDispatch({ type: UPDATE_BATCH_SIZE, payload: 128 });
    }
    // TODO: Fisher default 값 추가
    else {
      configDispatch({ type: UPDATE_EPOCHS, payload: 30 });
      configDispatch({ type: UPDATE_LEARNING_RATE, payload: 0.01 });
      configDispatch({ type: UPDATE_BATCH_SIZE, payload: 128 });
    }
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

  const handleBtnClick = async () => {
    resultFetchedRef.current = false;
    if (operationStatus) {
      try {
        setIsCancelling(true);
        const res = await fetch(`${API_URL}/unlearn/cancel`, {
          method: "POST",
        });
        if (!res.ok) {
          alert("Error occurred while cancelling the unlearning.");
          return;
        }
        resultFetchedRef.current = true;
        setOperationStatus(0);
        setIsCancelling(false);
      } catch (err) {
        console.error(err);
      }
    } else {
      if (mode === 0) {
        if (
          configState.epochs === 0 ||
          configState.batch_size === 0 ||
          configState.learning_rate === 0
        ) {
          alert("Please enter valid numbers");
          return;
        }
        setOperationStatus(1);
        setStatusMsg("Unlearning . . .");
        try {
          const method = configState.method;
          const end =
            method === FINE_TUNING
              ? "ft"
              : method === RANDOM_LABEL
              ? "rl"
              : method === GRADIENT_ASCENT
              ? "ga"
              : method === FISHER
              ? "fisher"
              : "retrain";
          const data = {
            batch_size: configState.batch_size,
            learning_rate: configState.learning_rate,
            epochs: configState.epochs,
            forget_class: configState.forget_class,
          };
          const res = await fetch(`${API_URL}/unlearn/${end}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            alert("Error occurred while sending a request for retraining.");
            setOperationStatus(0);
          }
        } catch (err) {
          console.error(err);
          setOperationStatus(0);
        }
      } else {
        if (!customFile) {
          alert("Please upload a weight file for unlearning.");
          return;
        }
        setOperationStatus(2);
        try {
          const formData = new FormData();
          formData.append("weights_file", customFile);
          formData.append("forget_class", configState.forget_class.toString());
          const res = await fetch(`${API_URL}/unlearn/custom`, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            alert(
              "Error occurred while sending a request for unlearning a custom file."
            );
            setOperationStatus(0);
            return;
          }
        } catch (err) {
          console.error(err);
          setOperationStatus(0);
        }
      }
    }
  };

  return (
    <>
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
              <label className={styles["predefined-label"]}>
                Predefined Method
              </label>
            </div>
            <select
              onChange={handleSelectUnlearningMethod}
              className={styles["predefined-select"]}
            >
              {Constants.UNLEARNING_METHODS.map((method, idx) => (
                <option key={idx} className={styles.option} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          {operationStatus ? (
            <div className={styles["status-wrapper"]}>
              <span className={styles.status}>{statusMsg}</span>
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
                value={trainedModel}
                setStateString={setTrainedModel}
                optionData={trainedModels}
                type="select"
                disabled={configState.method === "Retrain"}
              />
              <Input
                labelName="Forget Class"
                value={configState.forget_class}
                dispatch={configDispatch}
                optionData={Constants.UNLEARN_CLASSES}
                type="select"
              />
              <Input
                labelName="Epochs"
                value={configState.epochs}
                dispatch={configDispatch}
                type="number"
              />
              <Input
                labelName="Batch Size"
                value={configState.batch_size}
                dispatch={configDispatch}
                type="number"
              />
              <Input
                labelName="Learning Rate"
                value={configState.learning_rate}
                dispatch={configDispatch}
                type="number"
              />
            </div>
          )}
        </div>
        {/* TODO: Custom canceling status 표시 */}
        <div
          id="custom"
          onClick={handleSectionClick}
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
              onChange={handleCustomFileUpload}
              className={styles["file-input"]}
              type="file"
              id="custom-unlearning"
            />
          </div>
          <div>
            <Input
              labelName="Forget Class"
              value={configState.forget_class}
              dispatch={configDispatch}
              optionData={Constants.UNLEARN_CLASSES}
              type="select"
            />
          </div>
        </div>
      </div>
      <div className={styles["button-wrapper"]}>
        <div onClick={handleBtnClick} className={styles.button}>
          {operationStatus ? "Cancel" : "Run"}
        </div>
      </div>
    </>
  );
}
