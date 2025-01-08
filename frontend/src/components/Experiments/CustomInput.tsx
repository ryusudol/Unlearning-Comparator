import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

import { Input } from "../UI/input";

interface Props {
  mode: 0 | 1;
  handleCustomFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CustomInput({ mode, handleCustomFileUpload }: Props) {
  return (
    <div className="w-full flex justify-between items-center">
      <div className="flex justify-center items-center">
        <FontAwesomeIcon
          className="w-[11px] mr-1"
          icon={mode ? faCircleCheck : faCircle}
        />
        <label>Custom Model</label>
      </div>
      <Input
        onChange={handleCustomFileUpload}
        type="file"
        id="custom-training"
        className="w-[130px] h-[19px] text-[13px] cursor-pointer file:hidden py-0 px-2"
      />
    </div>
  );
}
