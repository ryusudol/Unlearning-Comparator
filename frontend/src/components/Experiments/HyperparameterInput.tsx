import React from "react";

import { Input } from "../UI/input";
import { PlusIcon } from "../UI/icons";
import { COLORS } from "../../constants/colors";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  title: string;
}

export default function HyperparameterInput({ title, ...props }: Props) {
  return (
    <div className="grid grid-cols-[80px,1fr,auto] gap-y-2">
      <span className="text-sm">{title}</span>
      <Input
        type="number"
        className="w-[194px] h-[25px] px-1.5 mx-2"
        {...props}
      />
      <div className="flex items-center">
        <PlusIcon
          className="w-2 h-2 cursor-pointer ml-1.5"
          color={COLORS.BUTTON_BG_COLOR}
        />
      </div>
    </div>
  );
}
