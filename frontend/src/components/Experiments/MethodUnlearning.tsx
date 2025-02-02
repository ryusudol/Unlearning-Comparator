import React from "react";

import HyperparameterInput from "./HyperparameterInput";
import { HyperparametersIcon } from "../UI/icons";
import { Badge } from "../UI/badge";

const EPOCHS = "epochs";
const LEARNING_RATE = "learningRate";
const BATCH_SIZE = "batchSize";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  epochs: number | "";
  epochsList: (number | "")[];
  learningRate: string;
  learningRateList: string[];
  batchSize: number | "";
  batchSizeList: (number | "")[];
  onPlusClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBadgeClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export default function MethodUnlearning({
  epochs,
  epochsList,
  learningRate,
  learningRateList,
  batchSize,
  batchSizeList,
  onPlusClick,
  onBadgeClick,
  ...props
}: Props) {
  return (
    <div>
      <div className="flex items-center mb-2">
        <HyperparametersIcon className="w-3.5 ml-[1px] mr-[5px]" />
        <p>Hyperparameters</p>
      </div>
      <div className="ml-10 grid gap-y-2">
        {/* Epochs */}
        <div className="grid gap-y-1.5">
          {epochsList.length > 0 && (
            <div className="flex justify-center gap-x-2">
              {epochsList.map((epoch, idx) => (
                <Badge
                  id={EPOCHS}
                  key={idx}
                  onClick={onBadgeClick}
                  className="px-2 py-1 text-xs cursor-pointer bg-[#585858] hover:bg-[#696969]"
                >
                  {epoch}
                </Badge>
              ))}
            </div>
          )}
          <HyperparameterInput
            id={EPOCHS}
            title="Epochs"
            paramList={epochsList}
            onPlusClick={onPlusClick}
            value={epochs}
            {...props}
          />
        </div>
        {/* Learning Rate */}
        <div className="grid gap-y-1.5">
          {learningRateList.length > 0 && (
            <div className="flex justify-center gap-x-2 mt-1.5">
              {learningRateList.map((rate, idx) => (
                <Badge
                  id={LEARNING_RATE}
                  key={idx}
                  onClick={onBadgeClick}
                  className="px-2 py-1 text-xs cursor-pointer bg-[#585858] hover:bg-[#696969]"
                >
                  {rate}
                </Badge>
              ))}
            </div>
          )}
          <HyperparameterInput
            id={LEARNING_RATE}
            title="Learning Rate"
            paramList={learningRateList}
            onPlusClick={onPlusClick}
            value={learningRate}
            {...props}
          />
        </div>
        {/* Batch Size */}
        <div className="grid gap-y-1.5">
          {batchSizeList.length > 0 && (
            <div className="flex justify-center gap-x-2 mt-1.5">
              {batchSizeList.map((batch, idx) => (
                <Badge
                  id={BATCH_SIZE}
                  key={idx}
                  onClick={onBadgeClick}
                  className="px-2 py-1 text-xs cursor-pointer bg-[#585858] hover:bg-[#696969]"
                >
                  {batch}
                </Badge>
              ))}
            </div>
          )}
          <HyperparameterInput
            id={BATCH_SIZE}
            title="Batch Size"
            paramList={batchSizeList}
            onPlusClick={onPlusClick}
            value={batchSize}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}
