import React, { useState } from "react";
import styles from "./Settings.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import Title from "../views/Title";
import ContentBox from "../views/ContentBox";
import Input from "../views/Input";
import SubTitle from "../views/SubTitle";
import Button from "../views/Button";

const DATASETS = ["CIFAR-10", "MNIST"];
const METHODS = ["method1", "method2", "method3", "method4"];
const MODELS = ["ResNet18"];
const UNLEARN_CLASSES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function Settings() {
  const [mode, setMode] = useState(0);

  const handlePredefinedClick = () => {
    setMode(0);
  };

  const handleCustomClick = () => {
    setMode(1);
  };

  return (
    <section>
      <Title title="Settings" />
      <ContentBox height={240}>
        <div className={styles["subset-wrapper"]}>
          <SubTitle subtitle="Training Configuration" />
          <div onClick={handlePredefinedClick} className={styles.predefined}>
            <div className={styles.mode}>
              <FontAwesomeIcon
                className={styles.icon}
                icon={mode ? faCircle : faCircleCheck}
              />
              <span>Predefined</span>
            </div>
            <Input labelName="Model" optionData={MODELS} type="select" />
            <Input labelName="Dataset" optionData={DATASETS} type="select" />
            <Input labelName="Epochs" type="number" />
            <Input labelName="Batch Size" type="number" />
            <Input labelName="Learning Rate" type="number" />
          </div>
          <div onClick={handleCustomClick} className={styles.custom}>
            <div>
              <FontAwesomeIcon
                className={styles.icon}
                icon={mode ? faCircleCheck : faCircle}
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
