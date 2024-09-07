import React, { useState, useContext } from "react";
import { Button } from "./button";

import Input from "../Input";
import PredefinedInput from "../PredefinedInput";
import CustomInput from "../CustomInput";
import OperationStatus from "../OperationStatus";
import { DEFENSE_METHODS } from "../../constants/defense";
import { DefenseConfigurationData } from "../../types/settings";
import { RunningStatusContext } from "../../store/running-status-context";

export interface DefenseProps {
  unlearnedModels: string[];
}

export default function Defense({ unlearnedModels }: DefenseProps) {
  const { isRunning, indicator, status } = useContext(RunningStatusContext);

  const [mode, setMode] = useState<0 | 1>(0);
  const [customFile, setCustomFile] = useState<File>();

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
      {isRunning ? (
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
              defaultValue={unlearnedModels[0]}
              optionData={unlearnedModels}
            />
            <Input labelName="Parameter 1" defaultValue={0} />
            <Input labelName="Parameter 2" defaultValue={0} />
            <Input labelName="Parameter 3" defaultValue={0} />
          </div>
          <div id="custom" onClick={handleSectionClick}>
            <CustomInput
              mode={mode}
              handleCustomFileUpload={handleCustomFileUpload}
            />
          </div>
        </div>
      )}
      <Button className="w-12 h-6 text-[14px] text-[#fefefe] absolute bottom-[10px] left-[262px]">
        {isRunning ? "Cancel" : "Run"}
      </Button>
    </form>
  );
}
