import { useState, useRef, forwardRef } from "react";
import { AiOutlineHome } from "react-icons/ai";

import { GitCompareIcon } from "../components/ui/icons";
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

const ScatterPlot = forwardRef(({ mode, data }: Props) => {
  const [fDataShow, setFDataShow] = useState(true);
  const [fClassShow, setFClassShow] = useState(true);
  const [rDataShow, setRDataShow] = useState(true);
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
        <GitCompareIcon className="mr-[2px]" />
        <h5 className="text-[15px] ml-[2px]">{mode} Model (id02)</h5>
      </div>
      <div>
        <div className="flex items-center space-x-2 relative left-[220px]">
          <span className="text-[13px] font-light mr-2">Forgotten:</span>
          <div className="flex items-center">
            <Switch
              id="forget-data"
              className="mr-[5px]"
              checked={fDataShow}
              onCheckedChange={setFDataShow}
            />
            <Label htmlFor="forget-data" className="text-[13px] font-light">
              Data
            </Label>
          </div>
          <div className="flex items-center">
            <Switch
              id="forget-class"
              className="mr-[5px]"
              checked={fClassShow}
              onCheckedChange={setFClassShow}
            />
            <Label htmlFor="forget-class" className="text-[13px] font-light">
              Class
            </Label>
          </div>
        </div>
        <div className="flex space-x-2 relative left-[220px]">
          <span className="text-[13px] font-light mr-[6px]">Remained:</span>
          <div className="flex items-center">
            <Switch
              id="remaining-data"
              className="mr-[5px]"
              checked={rDataShow}
              onCheckedChange={setRDataShow}
            />
            <Label htmlFor="remaining-data" className="text-[13px] font-light">
              Data
            </Label>
          </div>
          <div className="flex items-center">
            <Switch
              id="remaining-class"
              className="mr-[5px]"
              checked={rClassShow}
              onCheckedChange={setRClassShow}
            />
            <Label htmlFor="remaining-class" className="text-[13px] font-light">
              Class
            </Label>
          </div>
        </div>
      </div>
      <div className="w-[630px] h-[620px] flex flex-col justify-center items-center">
        <Chart data={data} width={650} height={630} ref={chartRef} />
      </div>
    </div>
  );
});

export default ScatterPlot;
