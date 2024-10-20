import { useState, useRef } from "react";
import { AiOutlineHome } from "react-icons/ai";

import ScatterPlot from "./ScatterPlot";

export type ModeType = "Baseline" | "Comparison";

interface Props {
  mode: ModeType;
  height: number;
  data: number[][] | undefined;
  id: string;
}

export default function Embedding({ mode, height, data, id }: Props) {
  const [fDataShow, setFDataShow] = useState(true);
  const [rDataShow, setRDataShow] = useState(true);
  const [fClassShow, setFClassShow] = useState(true);
  const [rClassShow, setRClassShow] = useState(true);

  const chartRef = useRef<{ reset: () => void } | null>(null);

  const handleResetClick = () => {
    if (chartRef && typeof chartRef !== "function" && chartRef.current) {
      chartRef.current.reset();
    }
  };

  return (
    <div
      style={{ height: `${height}px` }}
      className="flex flex-col justify-start items-center relative"
    >
      <AiOutlineHome
        className="mr-1 scale-90 cursor-pointer absolute top-2 left-0 z-10"
        onClick={handleResetClick}
      />
      <h5 className="text-[17px]">
        {mode} Model ({id})
      </h5>
      <div className="w-[672px] h-[672px] flex flex-col justify-center items-center">
        <ScatterPlot
          mode={mode}
          data={data}
          toggleOptions={[fDataShow, rDataShow, fClassShow, rClassShow]}
          ref={chartRef}
        />
      </div>
    </div>
  );
}
