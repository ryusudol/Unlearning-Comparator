import React, { useState, useEffect } from "react";
import styles from "./UnlearningConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import Input from "../components/Input";

const UNLEARNING_METHODS = ["SalUn", "Boundary", "Instance-wise"];
const UNLEARN_CLASSES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const API_URL = "http://localhost:8000";

export default function UnlearningConfiguration() {
  const [unlearningMode, setUnlearningMode] = useState<0 | 1 | 2>(0); // 0: Previous, 1: Predefined, 2: Custom
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearningMethod, setUnlearningMethod] = useState("SalUn");
  const [unlearnClass, setUnlearnClass] = useState("0");
  const [unlearningBatchSize, setUnlearningBatchSize] = useState(0);
  const [unlearningRate, setUnlearningRate] = useState(0);
  const [unlearningEpochs, setUnlearningEpochs] = useState(0);
  const [unlearningCustomFile, setUnlearningCustomFile] = useState<File>();

  useEffect(() => {
    const func = async () => {
      try {
        const res = await fetch(`${API_URL}/trained_models`);
        if (!res.ok) {
          alert("Error occurred while fetching trained models.");
          return;
        }
        const json = await res.json();
        setTrainedModels(json);
      } catch (err) {
        console.log(err);
      }
    };
    func();
  }, []);

  const handleSelectUnlearningMethod = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.currentTarget.value;
    setUnlearningMethod(method);
  };

  const handlePrevClick = () => {
    setUnlearningMode(0);
  };

  const handlePredefinedClick = () => {
    setUnlearningMode(1);
  };

  const handleCustomClick = () => {
    setUnlearningMode(2);
  };

  const handleRunBtnClick = async () => {
    // try {
    //     const data = {
    //       class: unlearnClass,
    //       batch_size: unlearningBatchSize,
    //       learning_rate: unlearningRate,
    //       epochs: unlearningEpochs,
    //     };
    //     const res = await fetch(`${API_URL}/unlearn`, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(data),
    //     });
    //     if (!res.ok) {
    //       alert("Error occurred while sending a request for training.");
    //       return;
    //     }
    //     const json = await res.json();
    //     console.log(json);
    // } catch (err) {
    //   console.log(err);
    // }
  };

  return (
    <ContentBox height={215}>
      <div className={styles["subset-wrapper"]}>
        <SubTitle subtitle="Unlearning Configuration" />
        <div
          id="unlearning-previous"
          onClick={handlePrevClick}
          className={styles.custom}
        >
          <div>
            <FontAwesomeIcon
              className={styles.icon}
              icon={unlearningMode === 0 ? faCircleCheck : faCircle}
            />
            <span>Trained Model</span>
          </div>
          <select className={styles["predefined-select"]}>
            {trainedModels.map((model, idx) => (
              <option key={idx} value={model} className={styles.option}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div
          id="unlearning-predefined"
          onClick={handlePredefinedClick}
          className={styles.predefined}
        >
          <div className={styles.mode}>
            <div>
              <FontAwesomeIcon
                className={styles.icon}
                icon={unlearningMode === 1 ? faCircleCheck : faCircle}
              />
              <label>Predefined</label>
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
          <Input
            labelName="Unlearn Class"
            value={unlearnClass}
            setStateString={setUnlearnClass}
            optionData={UNLEARN_CLASSES}
            type="select"
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
          <Input
            labelName="Epochs"
            value={unlearningEpochs}
            setStateNumber={setUnlearningEpochs}
            type="number"
          />
        </div>
        <div
          id="unlearning-custom"
          onClick={handleCustomClick}
          className={styles.custom}
        >
          <div>
            <FontAwesomeIcon
              className={styles.icon}
              icon={unlearningMode === 2 ? faCircleCheck : faCircle}
            />
            <span>Custom</span>
          </div>
          <label htmlFor="custom-unlearning">
            <div className={styles["upload-btn"]}>Click to upload</div>
          </label>
          <input
            className={styles["file-input"]}
            type="file"
            id="custom-unlearning"
          />
        </div>
      </div>
      <div
        onClick={handleRunBtnClick}
        id="unlearning-run"
        className={styles["button-wrapper"]}
      >
        Run
      </div>
    </ContentBox>
  );
}
