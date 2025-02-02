import React, { useState, useEffect } from "react";

import { Input } from "../UI/input";
import { PlusIcon } from "../UI/icons";
import { COLORS } from "../../constants/colors";

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "list"> {
  id: string;
  title: string;
  paramList: (string | number)[];
  onPlusClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export default function HyperparameterInput({
  id,
  title,
  paramList,
  onPlusClick,
  ...props
}: Props) {
  // const [value, setValue] = useState();
  const [isListFull, setIsListFull] = useState(false);

  useEffect(() => {
    if (paramList.length === 5) {
      setIsListFull(true);
    } else {
      setIsListFull(false);
    }
  }, [paramList.length]);

  // const handleValueChange = () => {};

  return (
    <div className="grid grid-cols-[80px,1fr,auto] gap-y-2">
      <span className="text-sm">{title}</span>
      <Input
        id={id}
        type="number"
        className="w-[194px] h-[25px] px-1.5 mx-2"
        {...props}
      />
      <div
        id={id}
        className={`flex justify-center items-center border rounded ml-1.5 w-[25px] h-[25px] ${
          isListFull ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={!isListFull ? onPlusClick : undefined}
      >
        <PlusIcon className="w-2 h-2" color={COLORS.BUTTON_BG_COLOR} />
      </div>
    </div>
  );
}
