import React, { useState, useEffect, useRef } from "react";
import { AiOutlineHome } from "react-icons/ai";

import ScatterPlot from "./ScatterPlot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const VIEW_MODES: ViewModeType[] = [
  "All Instances",
  "Unlearning Target",
  "Unlearning Failed",
];

export type ViewModeType =
  | "All Instances"
  | "Unlearning Target"
  | "Unlearning Failed";
export type ModeType = "Baseline" | "Comparison";

interface Props {
  mode: ModeType;
  height: number;
  data: number[][] | undefined;
  id: string;
}

const Embedding = ({ mode, height, data, id }: Props) => {
  const [viewMode, setViewMode] = useState<ViewModeType>(VIEW_MODES[0]);

  const chartRef = useRef<{ reset: () => void } | null>(null);

  useEffect(() => {
    setViewMode(VIEW_MODES[0]);
  }, [id]);

  const handleResetClick = () => {
    if (chartRef && typeof chartRef !== "function" && chartRef.current) {
      chartRef.current.reset();
    }
  };

  const idExist = id !== "";

  return (
    <div
      style={{ height: `${height}px` }}
      className="flex flex-col justify-start items-center relative"
    >
      {idExist && (
        <div>
          <AiOutlineHome
            className="mr-1 cursor-pointer absolute top-2 left-0 z-10"
            onClick={handleResetClick}
          />
          <div className="flex items-center text-base absolute z-10 right-0 top-6">
            <span className="mr-1.5">Focus on:</span>
            <Select
              value={viewMode}
              defaultValue={VIEW_MODES[0]}
              onValueChange={(value: ViewModeType) => setViewMode(value)}
            >
              <SelectTrigger className="w-36 h-7 px-2">
                <SelectValue placeholder={0} />
              </SelectTrigger>
              <SelectContent>
                {VIEW_MODES.map((mode, idx) => (
                  <SelectItem key={idx} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div className="text-[17px] mt-1">
        {mode} Model {idExist ? `(${id})` : ""}
      </div>
      <div className="w-[672px] h-[672px] flex flex-col justify-center items-center">
        <ScatterPlot
          mode={mode}
          data={data}
          viewMode={viewMode}
          ref={chartRef}
        />
      </div>
    </div>
  );
};

export default React.memo(Embedding);
