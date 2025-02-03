import React, { useState, useEffect } from "react";

import HyperparameterInput from "./HyperparameterInput";
import Button from "../CustomButton";
import { getDefaultUnlearningConfig } from "../../utils/config/unlearning";
import { HyperparametersIcon } from "../UI/icons";
import { EPOCHS, LEARNING_RATE, BATCH_SIZE } from "./Unlearning";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  method: string;
  epochsList: string[];
  learningRateList: string[];
  batchSizeList: string[];
  onPlusClick: (id: string, value: string) => void;
  onBadgeClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function MethodUnlearning({
  method,
  epochsList,
  learningRateList,
  batchSizeList,
  onPlusClick,
  onBadgeClick,
  ...props
}: Props) {
  const [initialValues, setInitialValues] = useState(["10", "0.01", "64"]);

  useEffect(() => {
    const { epochs, learning_rate, batch_size } =
      getDefaultUnlearningConfig(method);

    setInitialValues([epochs, learning_rate, batch_size]);
  }, [method]);

  return (
    <div>
      <div className="flex items-center mb-2">
        <HyperparametersIcon className="w-3.5 ml-[1px] mr-[5px]" />
        <p>Hyperparameters</p>
      </div>
      <div className="ml-10 grid gap-y-2">
        {/* Epochs */}
        <div className="grid gap-y-1.5">
          <HyperparameterInput
            title="Epochs"
            initialValue={initialValues[0]}
            paramList={epochsList}
            onPlusClick={onPlusClick}
            {...props}
          />
          {epochsList.length > 0 && (
            <div className="flex justify-center gap-x-2">
              {epochsList.map((epoch, idx) => (
                <Button
                  type="button"
                  id={EPOCHS}
                  key={idx}
                  onClick={onBadgeClick}
                  className="px-2 py-1 text-xs cursor-pointer bg-[#585858] hover:bg-[#696969]"
                >
                  {epoch}
                </Button>
              ))}
            </div>
          )}
        </div>
        {/* Learning Rate */}
        <div className="grid gap-y-1.5">
          <HyperparameterInput
            title="Learning Rate"
            initialValue={initialValues[1]}
            paramList={learningRateList}
            onPlusClick={onPlusClick}
            {...props}
          />
          {learningRateList.length > 0 && (
            <div className="flex justify-center gap-x-2 mt-1.5">
              {learningRateList.map((rate, idx) => (
                <Button
                  type="button"
                  id={LEARNING_RATE}
                  key={idx}
                  onClick={onBadgeClick}
                  className="px-2 py-1 text-xs cursor-pointer bg-[#585858] hover:bg-[#696969]"
                >
                  {rate}
                </Button>
              ))}
            </div>
          )}
        </div>
        {/* Batch Size */}
        <div className="grid gap-y-1.5">
          <HyperparameterInput
            title="Batch Size"
            initialValue={initialValues[2]}
            paramList={batchSizeList}
            onPlusClick={onPlusClick}
            {...props}
          />
          {batchSizeList.length > 0 && (
            <div className="flex justify-center gap-x-2 mt-1.5">
              {batchSizeList.map((batch, idx) => (
                <Button
                  type="button"
                  id={BATCH_SIZE}
                  key={idx}
                  onClick={onBadgeClick}
                  className="px-2 py-1 text-xs cursor-pointer bg-[#585858] hover:bg-[#696969]"
                >
                  {batch}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
