import React from "react";
import styles from "./App.module.css";

import Title from "./Components/Title";
import ContentBox from "./Components/ContentBox";
import SubTitle from "./Components/SubTitle";
import Button from "./Components/Button";
import SelectInput from "./Components/SelectInput";
import ManualInput from "./Components/ManualInput";
import SelectFromSubInput from "./Components/SelectFromSubInput";
import { MODELS } from "./constants/models";
import { DATASETS } from "./constants/datasets";
import { METHODS } from "./constants/methods";
import { SEEDS } from "./constants/seed";
import { UNLEARN_CLASSES } from "./constants/unlearnClasses";
import { BATCH_SIZES } from "./constants/batchSize";

export default function App() {
  return (
    <div id={styles["body-wrapper"]}>
      <div className={styles.left}>
        <Title title="Settings" />
        <ContentBox height={45}>
          <div className={styles["subset-wrapper"]}>
            <SubTitle subtitle="Initial Settings" />
            <SelectInput labelName="Model" optionData={MODELS} />
            <SelectInput labelName="Dataset" optionData={DATASETS} />
            <SelectFromSubInput
              name="Method"
              subNames={["Predefined", "Custom"]}
              subTypes={["select", "file"]}
              optionData={[METHODS]}
            />
            <SelectInput labelName="Seed" optionData={SEEDS} />
            <SelectInput
              labelName="Unlearn Class"
              optionData={UNLEARN_CLASSES}
              labelFontSize="md"
            />
          </div>
          <div style={{ marginTop: "1rem" }} />
          <div className={styles["subset-wrapper"]}>
            <SubTitle subtitle="Training | Unlearning" />
            <SelectInput labelName="Batch Size" optionData={BATCH_SIZES} />
            <ManualInput labelName="Learning Rate" type="number" />
            <ManualInput labelName="Epochs" type="number" />
          </div>
          <div style={{ marginTop: "0.6rem" }} />
          <Button buttonText="Run" />
        </ContentBox>
        <ContentBox height={25}></ContentBox>
        <Title title="Histories" />
        <ContentBox height={20}></ContentBox>
      </div>
      <div className={styles.middle}>
        <Title title="Embeddings" />
        <ContentBox height={45}></ContentBox>
        <Title title="Performance Metrics" />
        <ContentBox height={45}></ContentBox>
      </div>
      <div className={styles.right}>
        <Title title="Privacy Attacks" />
        <ContentBox height={50}></ContentBox>
        <ContentBox height={45}></ContentBox>
      </div>
    </div>
  );
}
