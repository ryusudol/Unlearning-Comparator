import React from "react";

import HyperparameterInput from "./HyperparameterInput";
import { HyperparametersIcon } from "../UI/icons";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  epochs: number | "";
  learningRate: string;
  batchSize: number | "";
}

export default function MethodUnlearning({
  epochs,
  learningRate,
  batchSize,
  ...props
}: Props) {
  return (
    <div>
      <div className="flex items-center mb-2">
        <HyperparametersIcon className="w-3.5 ml-[1px] mr-[5px]" />
        <p>Hyperparameters</p>
      </div>
      <div className="ml-10 grid grid-rows-3 gap-y-2">
        <HyperparameterInput
          id="epochs"
          title="Epochs"
          value={epochs}
          {...props}
        />
        <HyperparameterInput
          id="learningRate"
          title="Learning Rate"
          value={learningRate}
          {...props}
        />
        <HyperparameterInput
          id="batchSize"
          title="Batch Size"
          value={batchSize}
          {...props}
        />
      </div>
    </div>
  );
}
