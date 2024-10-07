import { useState, useRef } from "react";
import { AiOutlineHome } from "react-icons/ai";

import { NeuralNetworkIcon, GitCompareIcon } from "../components/ui/icons";
import Chart from "../components/Chart";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

type Props = {
  mode: "Baseline" | "Comparison";
  data: number[][];
};
type ChartRef = {
  reset: () => void;
};

const ScatterPlot = ({ mode, data }: Props) => {
  const [fDataShow, setFDataShow] = useState(true);
  const [rDataShow, setRDataShow] = useState(true);
  const [fClassShow, setFClassShow] = useState(true);
  const [rClassShow, setRClassShow] = useState(true);

  const chartRef = useRef<ChartRef | null>(null);

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
        <h5 className="text-[15px] ml-[2px]">{mode} Model (id)</h5>
      </div>
      <div className="relative top-6 right-2">
        <div className="flex items-center space-x-2 relative left-[220px]">
          <span className="text-[13px] font-light mr-2">Data:</span>
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
        <div className="flex space-x-2 relative left-[220px]">
          <span className="text-[13px] font-light mr-1">Class:</span>
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
      <div className="w-[630px] h-[620px] flex flex-col justify-center items-center">
        <Chart
          data={data}
          toggleOptions={[fDataShow, rDataShow, fClassShow, rClassShow]}
          ref={chartRef}
        />
      </div>
    </div>
  );
};

export default ScatterPlot;
