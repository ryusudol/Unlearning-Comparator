import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/UI/select";
import { Input } from "../components/UI/input";

type PropsType = {
  labelName: string;
  defaultValue: string | number | undefined;
  optionData?: string[];
  disabled?: boolean;
};

export default function MyInput({
  labelName,
  defaultValue,
  optionData,
  disabled,
}: PropsType) {
  const [open, setOpen] = useState(false);

  const words = labelName.split(" ");
  const label = words.length < 3 ? labelName : `${words[1]} ${words[2]}`;
  const name = labelName.toLowerCase().replaceAll(" ", "_");

  return (
    <div className="flex justify-between items-center ml-[50px]">
      <label className="text-[15px]" htmlFor={label}>
        {label}
      </label>
      {optionData ? (
        <Select onOpenChange={setOpen} name={name} disabled={disabled}>
          <SelectTrigger
            id={label}
            className="w-[130px] h-[19px] bg-white text-black pl-2 pr-1 text-[13px]"
          >
            <SelectValue
              placeholder={
                defaultValue
                  ? defaultValue.toString().length > 13
                    ? defaultValue.toString().slice(0, 13) + "..."
                    : defaultValue
                  : ""
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white text-black overflow-ellipsis whitespace-nowrap">
            {optionData.map((datum, idx) => {
              const data = datum.slice(0, 13) + "...";
              return (
                <SelectItem key={idx} value={datum} className="text-[13px]">
                  {open ? datum : data}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type="number"
          id={label}
          className="w-[130px] h-[19px] px-2 text-[13px] overflow-ellipsis whitespace-nowrap"
          name={name}
          defaultValue={defaultValue}
          placeholder="Please enter a value"
          step={labelName === "Learning Rate" ? 0.0001 : 1}
        />
      )}
    </div>
  );
}
