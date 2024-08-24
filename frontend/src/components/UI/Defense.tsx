import React, { useState } from "react";

import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import CustomInput from "../CustomInput";
import RunButton from "../RunButton";
import OperationStatus from "../OperationStatus";
import { DEFENSE_METHODS, UNLEARNED_MODELS } from "../../constants/defense";
import { DefenseStatus, DefenseConfigurationData } from "../../types/settings";

export interface DefenseProps {
  operationStatus: number;
  setOperationStatus: (val: 0 | 1 | 2) => void;
  unlearnedModels: string[];
}

export default function Defense({
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

  return (
    <form onSubmit={handleRunBtnClick}>
      {operationStatus ? (
        <OperationStatus
          identifier="defense"
          indicator={indicator}
          status={status}
        />
      ) : (
        <div>
          <div id="predefined" onClick={handleSectionClick}>
            <PredefinedInput mode={mode} optionData={DEFENSE_METHODS} />
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
            <CustomInput
              mode={mode}
              customFile={customFile}
              handleCustomFileUpload={handleCustomFileUpload}
            />
          </div>
        </div>
      )}
      <RunButton operationStatus={operationStatus} />
    </form>
  );
}
