import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import Input from "../components/Input";
import SubTitle from "../components/SubTitle";

const DATASETS = ["CIFAR-10", "MNIST"];
const UNLEARNING_METHODS = ["SalUn", "Boundary", "Instance-wise"];
const METHODS = ["method1", "method2", "method3", "method4"];
const MODELS = ["ResNet-18"];
const UNLEARN_CLASSES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const PREV_UNLEARNED_MODELS = [
  "Unlearned Model 1",
  "Unlearned Model 2",
  "Unlearned Model 3",
];

const API_URL = "http://localhost:8000";

export default function Settings() {
  const [trainingMode, setTrainingMode] = useState<0 | 1>(0); // 0: Predefined, 1: Custom
  const [unlearningMode, setUnlearningMode] = useState<0 | 1 | 2>(0); // 0: Previous, 1: Predefined, 2: Custom
  const [defenseMode, setDefenseMode] = useState<0 | 1 | 2>(0); // 0: Previous, 1: Predefined, 2: Custom

  // training configuration
  const [model, setModel] = useState("ResNet-18");
  const [dataset, setDataset] = useState("CIFAR-10");
  const [trainingEpochs, setTrainingEpochs] = useState(0);
  const [trainingBatchSize, setTrainingBatchSize] = useState(0);
  const [trainingLearningRate, setTrainingLearningRate] = useState(0);
  const [trainingSeed, setTrainingSeed] = useState(0);
  const [trainingCustomFile, setTrainingCustomFile] = useState<File>();

  // unlearning configuration
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearningMethod, setUnlearningMethod] = useState("SalUn");
  const [unlearnClass, setUnlearnClass] = useState("0");
  const [unlearningBatchSize, setUnlearningBatchSize] = useState(0);
  const [unlearningRate, setUnlearningRate] = useState(0);
  const [unlearningEpochs, setUnlearningEpochs] = useState(0);
  const [unlearningCustomFile, setUnlearningCustomFile] = useState<File>();

  const [defenseMethod, setDefenseMethod] = useState("method1");
  const [defenseParameter1, setDefenseParameter1] = useState(0);
  const [defenseParameter2, setDefenseParameter2] = useState(0);
  const [defenseParameter3, setDefenseParameter3] = useState(0);
  const [defenseCustomFile, setDefenseCustomFile] = useState<File>();

  useEffect(() => {
    const func = async () => {
      const res = await fetch(`${API_URL}/trained_models`);
      if (!res.ok) {
        // TODO: Trained Models 불러올 때 에러 시 팝업 뜨는 기능 구현
      }
      const json = await res.json();
      setTrainedModels(json);
    };
    func();
  }, []);

  const handlePredefinedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "training-predefined") setTrainingMode(0);
    else if (id === "unlearning-predefined") setUnlearningMode(1);
    else if (id === "defense-predefined") setDefenseMode(1);
  };

  const handleCustomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "training-custom") setTrainingMode(1);
    else if (id === "unlearning-custom") setUnlearningMode(2);
    else if (id === "defense-custom") setDefenseMode(2);
  };

  const handlePrevClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "unlearning-previous") setUnlearningMode(0);
    else if (id === "defense-previous") setDefenseMode(0);
  };

  const handleSelectUnlearningMethod = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.currentTarget.value;
    setUnlearningMethod(method);
  };

  const handleSelectDefenseMethod = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const method = e.currentTarget.value;
    setDefenseMethod(method);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.currentTarget.id;
    const uploadedFile = e.currentTarget.files
      ? e.currentTarget.files[0]
      : null;
    if (!uploadedFile) return;
    else if (id === "custom-training") setTrainingCustomFile(uploadedFile);
    else if (id === "custom-unlearning") setUnlearningCustomFile(uploadedFile);
    else if (id === "custom-defense") setDefenseCustomFile(uploadedFile);
  };

  const handleRunBtnClick = async () => {
    console.log("Run Button Clicked !");
  };

  return (
    <section>
      <Title title="Settings" />
      {/* Training Configuration */}
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
        <div onClick={handleRunBtnClick} className={styles["button-wrapper"]}>
          Run
        </div>
      </ContentBox>
      {/* Unlearning Configuration */}
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
        <div onClick={handleRunBtnClick} className={styles["button-wrapper"]}>
          Run
        </div>
      </ContentBox>
      {/* Defense Configuration */}
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
        <div onClick={handleRunBtnClick} className={styles["button-wrapper"]}>
          Run
        </div>
      </ContentBox>
    </section>
  );
}
