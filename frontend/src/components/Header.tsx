import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/UI/select";
import { PlayCircleIcon } from "lucide-react";

export default function Header() {
  const [forgetClass, setForgetClass] = useState("0");
  const [baselineModel, setBaselineModel] = useState("231a");
  const [comparisonModel, setComparisonModel] = useState("231a");

  const handleApplyBtnClick = () => {
    console.log("Apply Button Clicked!");
  };

  return (
    <div className="w-full text-white bg-black h-[66px] flex justify-center items-center px-4">
      <div className="text-[30px] font-semibold absolute left-4">
        <span>UnlearningVis</span>
      </div>
      <ul className="flex text-[20px] font-semibold">
        <li className="flex items-center">
          <span className="mr-[10px]">Forget Class</span>
          <Select onValueChange={setForgetClass} value={forgetClass}>
            <SelectTrigger className="w-[128px] h-6 bg-white text-black">
              <SelectValue placeholder="0" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                (el, idx) => (
                  <SelectItem key={idx} value={el}>
                    {el}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </li>
        <li className="flex items-center mx-10">
          <span className="mr-[10px]">Baseline Model</span>
          <Select onValueChange={setBaselineModel} value={baselineModel}>
            <SelectTrigger className="w-[128px] h-6 bg-white text-black">
              <SelectValue placeholder="Select a forget class" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {["231a"].map((el, idx) => (
                <SelectItem className="font-black" key={idx} value={el}>
                  {el}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </li>
        <li className="flex items-center">
          <span className="mr-[10px]">Comparison Model</span>
          <Select onValueChange={setComparisonModel} value={comparisonModel}>
            <SelectTrigger className="w-[128px] h-6 bg-white text-black">
              <SelectValue placeholder="Select a forget class" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {["231a"].map((el, idx) => (
                <SelectItem className="font-black" key={idx} value={el}>
                  {el}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </li>
        <li
          onClick={handleApplyBtnClick}
          className="ml-10 cursor-pointer flex items-center"
        >
          <PlayCircleIcon />
        </li>
      </ul>
    </div>
  );
}
