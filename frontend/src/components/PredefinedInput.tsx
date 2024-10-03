import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Props {
  mode: 0 | 1;
  handleMethodSelection?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  optionData?: string[];
}

export default function PredefinedInput({
  mode,
  handleMethodSelection,
  optionData,
}: Props) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex justify-center items-center">
        <FontAwesomeIcon
          className="w-[11px] mr-1"
          icon={mode ? faCircle : faCircleCheck}
        />
        <label>Predefined {optionData ? "Method" : "Setting"}</label>
      </div>
      {optionData && (
        // onValueChange -> handleMethodSelection 함수 붙이기
        <Select defaultValue={optionData[0]} name="method">
          <SelectTrigger className="w-[130px] h-[19px] pl-2 pr-1 whitespace-nowrap overflow-ellipsis focus:outline-none bg-white text-black">
            <SelectValue placeholder={optionData[0]} />
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
            {optionData.map((datum, idx) => (
              <SelectItem key={idx} value={datum} className="text-[12px]">
                {datum}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
