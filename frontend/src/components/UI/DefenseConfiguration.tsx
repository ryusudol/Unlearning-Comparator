import React, { useState } from "react";
import styles from "./DefenseConfiguration.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import Input from "../Input";
import RunButton from "../RunButton";
import CustomFileInput from "../CustomFileInput";
import OperationStatus from "../OperationStatus";
import {
  DefenseProps,
  DefenseStatus,
  DefenseConfigurationData,
} from "../../types/settings";
import { DEFENSE_METHODS, UNLEARNED_MODELS } from "../../constants/defense";

export default function DefenseConfiguration({
  operationStatus,
  setOperationStatus,
  unlearnedModels,
}: DefenseProps) {
  const [mode, setMode] = useState<0 | 1>(0);
  const [indicator, setIndicator] = useState("");
  const [customFile, setCustomFile] = useState<File>();
  const [status, setStatus] = useState<DefenseStatus | undefined>();
  const [selectedUnlearnedModel, setSelectedUnlearnedModel] = useState(
    UNLEARNED_MODELS[0]
  );

  const handleSectionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === "predefined") setMode(0);
    else if (id === "custom") setMode(1);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files.length > 0)
      setCustomFile(e.currentTarget.files[0]);
  };

  const handleRunBtnClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const configState = Object.fromEntries(
      fd.entries()
    ) as unknown as DefenseConfigurationData;

    console.log(configState);
  };

  return operationStatus ? (
    <OperationStatus indicator={indicator} status={status} />
  ) : (
    <form onSubmit={handleRunBtnClick}>
      <div>
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
              <label className={styles.label}>Predefined Method</label>
            </div>
            <select name="method" className={styles.select}>
              {DEFENSE_METHODS.map((method, idx) => (
                <option key={idx} className={styles.option} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <Input
            labelName="Unlearned Model"
            defaultValue={selectedUnlearnedModel}
            optionData={UNLEARNED_MODELS}
            type="select"
          />
          <Input labelName="Parameter 1" defaultValue={0} type="number" />
          <Input labelName="Parameter 2" defaultValue={0} type="number" />
          <Input labelName="Parameter 3" defaultValue={0} type="number" />
        </div>
        <div id="custom" onClick={handleSectionClick}>
          <CustomFileInput
            mode={mode}
            customFile={customFile}
            handleCustomFileUpload={handleCustomFileUpload}
          />
        </div>
      </div>
      <RunButton operationStatus={operationStatus} />
    </form>
  );
}
