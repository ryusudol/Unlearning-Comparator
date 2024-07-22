import React, { useState } from "react";
import styles from "./Settings.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import Input from "../components/Input";
import SubTitle from "../components/SubTitle";
import Button from "../components/Button";

const DATASETS = ["CIFAR-10", "MNIST"];
const UNLEARNING_METHODS = ["SalUn", "Boundary", "Instance-wise"];
const METHODS = ["method1", "method2", "method3", "method4"];
const MODELS = ["ResNet-18"];
const UNLEARN_CLASSES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function Settings() {
  const [trainingMode, setTrainingMode] = useState(0);
  const [unlearningMode, setUnlearningMode] = useState(0);
  const [defenseMode, setDefenseMode] = useState(0);

  // training configuration
  const [model, setModel] = useState("ResNet-18");
  const [dataset, setDataset] = useState("CIFAR-10");
  const [trainingEpochs, setTrainingEpochs] = useState(0);
  const [trainingBatchSize, setTrainingBatchSize] = useState(0);
  const [trainingLearningRate, setTrainingLearningRate] = useState(0);
  const [trainingCustomFile, setTrainingCustomFile] = useState(0);

  // unlearning configuration
  const [unlearningMethod, setUnlearningMethod] = useState("SalUn");
  const [unlearnClass, setUnlearnClass] = useState("0");
  const [unlearningBatchSize, setUnlearningBatchSize] = useState(0);
  const [unlearningRate, setUnlearningRate] = useState(0);
  const [unlearningEpochs, setUnlearningEpochs] = useState(0);
  const [unlearningCustomFile, setUnlearningCustomFile] = useState(0);

  const [defenseMethod, setDefenseMethod] = useState("method1");
  const [defenseParameter1, setDefenseParameter1] = useState(0);
  const [defenseParameter2, setDefenseParameter2] = useState(0);
  const [defenseParameter3, setDefenseParameter3] = useState(0);
  const [defenseCustomFile, setDefenseCustomFile] = useState();

  const handlePredefinedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "training-predefined") setTrainingMode(0);
    else if (id === "unlearning-predefined") setUnlearningMode(0);
    else if (id === "defense-predefined") setDefenseMode(0);
  };

  const handleCustomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "training-custom") setTrainingMode(1);
    else if (id === "unlearning-custom") setUnlearningMode(1);
    else if (id === "defense-custom") setDefenseMode(1);
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

  return (
    <section>
      <Title title="Settings" />
      {/* Training Configuration */}
      <ContentBox height={240}>
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
            <label htmlFor="custom">
              <div className={styles["upload-btn"]}>Click to upload</div>
            </label>
            <input className={styles["file-input"]} type="file" id="custom" />
          </div>
        </div>
        <Button buttonText="Run" />
      </ContentBox>
      {/* Unlearning Configuration */}
      <ContentBox height={214}>
        <div className={styles["subset-wrapper"]}>
          <SubTitle subtitle="Unlearning Configuration" />
          <div
            id="unlearning-predefined"
            onClick={handlePredefinedClick}
            className={styles.predefined}
          >
            <div className={styles.mode}>
              <div>
                <FontAwesomeIcon
                  className={styles.icon}
                  icon={unlearningMode ? faCircle : faCircleCheck}
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
                icon={unlearningMode ? faCircleCheck : faCircle}
              />
              <span>Custom</span>
            </div>
            <label htmlFor="custom">
              <div className={styles["upload-btn"]}>Click to upload</div>
            </label>
            <input className={styles["file-input"]} type="file" id="custom" />
          </div>
        </div>
        <Button buttonText="Run" />
      </ContentBox>
      {/* Defense Configuration */}
      <ContentBox height={194}>
        <div className={styles["subset-wrapper"]}>
          <SubTitle subtitle="Defense Configuration" />
          <div
            id="defense-predefined"
            onClick={handlePredefinedClick}
            className={styles.predefined}
          >
            <div className={styles.mode}>
              <div>
                <FontAwesomeIcon
                  className={styles.icon}
                  icon={defenseMode ? faCircle : faCircleCheck}
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
                icon={defenseMode ? faCircleCheck : faCircle}
              />
              <span>Custom</span>
            </div>
            <label htmlFor="custom">
              <div className={styles["upload-btn"]}>Click to upload</div>
            </label>
            <input className={styles["file-input"]} type="file" id="custom" />
          </div>
        </div>
        <Button buttonText="Run" />
      </ContentBox>
    </section>
  );
}
