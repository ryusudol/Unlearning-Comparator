import React from "react";

import { Separator } from "../UI/separator";
import { useForgetClass } from "../../hooks/useForgetClass";
import { CIFAR_10_CLASSES } from "../../constants/common";
import { TABLEAU10 } from "../../constants/colors";
import { CircleIcon, FatMultiplicationSignIcon } from "../UI/icons";

export default function EmbeddingsLegend() {
  const { forgetClass } = useForgetClass();

  return (
    <div className="flex items-center bg-white border border-b-white rounded-t-[6px] px-2 py-1 absolute -top-[29px] -right-[1px] text-sm z-10">
      <div className="flex items-center mr-4">
        <span className="font-medium mr-2.5">Data Type</span>
        <ul className="flex items-center gap-[9.2px]">
          <li className="flex items-center">
            <CircleIcon className="w-[9px] h-[9px] text-[#4f5562] mr-[3px]" />
            <span>Remaining Data</span>
          </li>
          <li className="flex items-center">
            <FatMultiplicationSignIcon className="text-[#4f5562] mr-[3px]" />
            <span>Forgetting Target</span>
          </li>
        </ul>
      </div>
      <div className="flex items-center">
        <span className="font-medium mr-2.5">Prediction</span>
        <ul className="flex items-center gap-2">
          {CIFAR_10_CLASSES.map((name, idx) => (
            <li key={idx} className="flex items-center">
              <div
                style={{ backgroundColor: TABLEAU10[idx] }}
                className="w-3.5 h-3.5 mr-[3px]"
              />
              <span>{forgetClass === idx ? name + " (X)" : name}</span>
            </li>
          ))}
        </ul>
      </div>
      <Separator
        orientation="horizontal"
        className="absolute bottom-[1px] h-[1px] w-[calc(100%-16px)]"
      />
    </div>
  );
}
