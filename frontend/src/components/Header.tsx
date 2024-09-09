import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/UI/select";
import { PlayCircleIcon } from "lucide-react";
import { EraserIcon, NeuralNetworkIcon, GitCompareIcon } from "./UI/icons";

export default function Header() {
  const [forgetClass, setForgetClass] = useState("0");
  const [baselineModel, setBaselineModel] = useState("231a");
  const [comparisonModel, setComparisonModel] = useState("231a");

  const handleApplyBtnClick = () => {
    console.log("Apply Button Clicked!");
  };

  return (
    <div className="w-full text-white bg-black h-[66px] flex justify-center items-center px-4">
      <div className="flex items-center text-[30px] font-semibold absolute left-4">
        <img className="scale-90" src="/logo.png" alt="logo img" />
        <span className="ml-2">UnlearningVis</span>
      </div>
      <ul className="flex text-[20px] font-semibold">
        <li className="flex items-center">
          <EraserIcon className="text-white w-6 h-6 mr-1" />
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
        <li className="flex items-center mx-[22px]">
          <NeuralNetworkIcon className="text-white w-6 h-6 mr-1" />
          <span className="mr-[10px]">Baseline Model</span>
          <Select onValueChange={setBaselineModel} value={baselineModel}>
            <SelectTrigger className="w-[128px] h-6 bg-white text-black">
              <SelectValue placeholder="Select a forget class" />
            </SelectTrigger>
            <SelectContent defaultValue="231a" className="bg-white text-black">
              {["231a", "7g9b", "6k3a", "j30a"].map((el, idx) => (
                <SelectItem key={idx} value={el}>
                  {el}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </li>
        <li className="flex items-center">
          <GitCompareIcon className="text-white w-6 h-6 mr-1" />
          <span className="mr-[10px]">Comparison Model</span>
          <Select onValueChange={setComparisonModel} value={comparisonModel}>
            <SelectTrigger className="w-[128px] h-6 bg-white text-black">
              <SelectValue placeholder="Select a forget class" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {["231a"].map((el, idx) => (
                <SelectItem key={idx} value={el}>
                  {el}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </li>
        <li
          onClick={handleApplyBtnClick}
          className="w-10 h-10 flex justify-center rounded-full items-center ml-[18px] cursor-pointer bg-transparent hover:bg-slate-900 transition"
        >
          <PlayCircleIcon className="w-7 h-7" />
        </li>
      </ul>
    </div>
  );
}
