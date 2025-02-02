import React, { useState, useEffect } from "react";

import { Input } from "../UI/input";
import { PlusIcon } from "../UI/icons";
import { COLORS } from "../../constants/colors";
import { EPOCHS, LEARNING_RATE, BATCH_SIZE } from "./Unlearning";

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "list"> {
  title: string;
  initialValue: string;
  paramList: (string | number)[];
  onPlusClick: (id: string, value: string) => void;
}

const CONFIG = {
  EPOCHS_MIN: 1,
  EPOCHS_MAX: 20,
  LEARNING_RATE_MIN: 0.00001,
  LEARNING_RATE_MAX: 0.1,
  BATCH_SIZE_MIN: 1,
  BATCH_SIZE_MAX: 512,
} as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export default function HyperparameterInput({
  title,
  initialValue,
  paramList,
  onPlusClick,
  ...props
}: Props) {
  const [value, setValue] = useState<string>(initialValue);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (paramList.length === 5) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [paramList.length]);

  const processedTitle = title.replace(/\s+/g, "");
  const id = processedTitle.charAt(0).toLowerCase() + processedTitle.slice(1);
  const isIntegerInput = id === EPOCHS || id === BATCH_SIZE;

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;

    if (inputValue === "") {
      setValue(inputValue);
      setIsDisabled(true);
      return;
    }
    setIsDisabled(false);

    let newValue = inputValue;
    if (isIntegerInput && newValue.includes(".")) {
      newValue = parseInt(newValue, 10).toString();
    }

    switch (id) {
      case EPOCHS: {
        const clamped = clamp(
          Number(newValue),
          CONFIG.EPOCHS_MIN,
          CONFIG.EPOCHS_MAX
        );
        setValue(String(clamped));
        break;
      }
      case BATCH_SIZE: {
        const clamped = clamp(
          Number(newValue),
          CONFIG.BATCH_SIZE_MIN,
          CONFIG.BATCH_SIZE_MAX
        );
        setValue(String(clamped));
        break;
      }
      case LEARNING_RATE: {
        setValue(newValue);
        const numericValue = Number(newValue);
        if (
          numericValue > CONFIG.LEARNING_RATE_MAX ||
          numericValue < CONFIG.LEARNING_RATE_MIN
        ) {
          setIsDisabled(true);
        } else {
          setIsDisabled(false);
        }
        break;
      }
      default:
        setValue(newValue);
        break;
    }
  };

  const handlePlusClick = () => {
    if (!isDisabled) {
      onPlusClick(id, value);
    }
  };

  return (
    <div className="grid grid-cols-[80px,1fr,auto] gap-y-2">
      <span className="text-sm">{title}</span>
      <Input
        type="number"
        step={isIntegerInput ? "1" : "any"}
        className="w-[194px] h-[25px] px-1.5 mx-2"
        value={value}
        onChange={handleValueChange}
        {...props}
      />
      <div
        className={`flex justify-center items-center border rounded ml-1.5 w-[25px] h-[25px] ${
          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={handlePlusClick}
      >
        <PlusIcon className="w-2 h-2" color={COLORS.BUTTON_BG_COLOR} />
      </div>
    </div>
  );
}
