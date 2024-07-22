import React, { useState } from "react";
import styles from "./TrainingConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import Input from "../components/Input";

const METHODS = ["method1", "method2", "method3", "method4"];
const PREV_UNLEARNED_MODELS = [
  "Unlearned Model 1",
  "Unlearned Model 2",
  "Unlearned Model 3",
];

export default function DefenseConfiguration() {
  const [defenseMode, setDefenseMode] = useState<0 | 1 | 2>(0); // 0: Previous, 1: Predefined, 2: Custom
  const [defenseMethod, setDefenseMethod] = useState("method1");
  const [defenseParameter1, setDefenseParameter1] = useState(0);
  const [defenseParameter2, setDefenseParameter2] = useState(0);
  const [defenseParameter3, setDefenseParameter3] = useState(0);
  const [defenseCustomFile, setDefenseCustomFile] = useState<File>();

  // useEffect(() => {
  //   const func = async () => {
  //     try {
  //       const res = await fetch(`${API_URL}/trained_models`);
  //       if (!res.ok) {
  //         alert("Error occurred while fetching trained models.");
  //         return;
  //       }
  //       const json = await res.json();
  //       setTrainedModels(json);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   func();
  // }, []);

  const handlePrevClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setDefenseMode(0);
  };

  const handlePredefinedClick = () => {
    setDefenseMode(1);
  };

  const handleCustomClick = () => {
    setDefenseMode(2);
  };

  const handleSelectDefenseMethod = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.currentTarget.value;
    setDefenseMethod(method);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.currentTarget.files
      ? e.currentTarget.files[0]
      : null;
    if (!uploadedFile) return;
    setDefenseCustomFile(uploadedFile);
  };

  const handleRunBtnClick = async () => {
    // try {
    //   const data = {
    //     seed: trainingSeed,
    //     batch_size: trainingBatchSize,
    //     learning_rate: trainingLearningRate,
    //     epochs: trainingEpochs,
    //   };
    //   const res = await fetch(`${API_URL}/train`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(data),
    //   });
    //   if (!res.ok) {
    //     alert("Error occurred while sending a request for training.");
    //     return;
    //   }
    //   const json = await res.json();
    //   console.log(json);
    // } catch (err) {
    //   console.log(err);
    // }
  };

  return (
    <ContentBox height={194}>
      <div className={styles["subset-wrapper"]}>
        <SubTitle subtitle="Defense Configuration" />
        <div
          id="defense-previous"
          onClick={handlePrevClick}
          className={styles.custom}
        >
          <div>
            <FontAwesomeIcon
              className={styles.icon}
              icon={defenseMode === 0 ? faCircleCheck : faCircle}
            />
            <span>Unlearned Model</span>
          </div>
          <select className={styles["predefined-select"]}>
            {PREV_UNLEARNED_MODELS.map((model, idx) => (
              <option key={idx} value={model} className={styles.option}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div
          id="defense-predefined"
          onClick={handlePredefinedClick}
          className={styles.predefined}
        >
          <div className={styles.mode}>
            <div>
              <FontAwesomeIcon
                className={styles.icon}
                icon={defenseMode === 1 ? faCircleCheck : faCircle}
              />
              <label>Predefined</label>
            </div>
            <select
              onChange={handleSelectDefenseMethod}
              className={styles["predefined-select"]}
            >
              {METHODS.map((method, idx) => (
                <option key={idx} className={styles.option} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <Input
            labelName="parameter_1"
            value={defenseParameter1}
            setStateNumber={setDefenseParameter1}
            type="number"
          />
          <Input
            labelName="parameter_2"
            value={defenseParameter2}
            setStateNumber={setDefenseParameter2}
            type="number"
          />
          <Input
            labelName="parameter_3"
            value={defenseParameter3}
            setStateNumber={setDefenseParameter3}
            type="number"
          />
        </div>
        <div
          id="defense-custom"
          onClick={handleCustomClick}
          className={styles.custom}
        >
          <div>
            <FontAwesomeIcon
              className={styles.icon}
              icon={defenseMode === 2 ? faCircleCheck : faCircle}
            />
            <span>Custom</span>
          </div>
          <label htmlFor="custom-defense">
            <div className={styles["upload-btn"]}>Click to upload</div>
          </label>
          <input
            className={styles["file-input"]}
            type="file"
            id="custom-defense"
          />
        </div>
      </div>
      <div
        onClick={handleRunBtnClick}
        id="defense-run"
        className={styles["button-wrapper"]}
      >
        Run
      </div>
    </ContentBox>
  );
}
