import { useState, useRef } from "react";
import { AiOutlineHome } from "react-icons/ai";

import ScatterPlot from "./ScatterPlot";
import { NeuralNetworkIcon, GitCompareIcon } from "./ui/icons";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

type Props = {
  mode: "Baseline" | "Comparison";
  data: number[][] | undefined;
  id: string;
};

export default function Embedding({ mode, data, id }: Props) {
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
    <div className="flex flex-col items-center relative">
      <AiOutlineHome
        className="mr-1 scale-90 cursor-pointer absolute top-[7px] left-0"
        onClick={handleResetClick}
      />
      <div className="flex items-center relative top-1">
        {mode === "Baseline" ? (
          <NeuralNetworkIcon className="mr-[2px]" />
        ) : (
          <GitCompareIcon className="mr-[2px]" />
        )}
        <h5 className="text-[15px] ml-[2px]">
          {mode} Model ({id})
        </h5>
      </div>
      <div className="z-10">
        <div className="flex items-center space-x-2 relative left-[210px]">
          <span className="text-[13px] font-light mr-[10px]">Data Type:</span>
          <div className="flex items-center">
            <Switch
              id="data-forget"
              className="mr-[5px]"
              checked={fDataShow}
              onCheckedChange={setFDataShow}
            />
            <Label htmlFor="data-forget" className="text-[13px] font-light">
              Forget
            </Label>
          </div>
          <div className="flex items-center">
            <Switch
              id="data-remain"
              className="mr-[5px]"
              checked={rDataShow}
              onCheckedChange={setRDataShow}
            />
            <Label htmlFor="data-remain" className="text-[13px] font-light">
              Remain
            </Label>
          </div>
        </div>
        <div className="flex space-x-2 relative left-[210px]">
          <span className="text-[13px] font-light mr-1">Predictions:</span>
          <div className="flex items-center">
            <Switch
              id="class-forget"
              className="mr-[5px]"
              checked={fClassShow}
              onCheckedChange={setFClassShow}
            />
            <Label htmlFor="class-forget" className="text-[13px] font-light">
              Forget
            </Label>
          </div>
          <div className="flex items-center">
            <Switch
              id="class-remain"
              className="mr-[5px]"
              checked={rClassShow}
              onCheckedChange={setRClassShow}
            />
            <Label htmlFor="class-remain" className="text-[13px] font-light">
              Remain
            </Label>
          </div>
        </div>
      </div>
      <div className="w-[630px] h-[620px] flex flex-col justify-center items-center relative bottom-6">
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
