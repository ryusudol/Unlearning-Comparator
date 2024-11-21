import React, {
  useState,
  useEffect,
  useContext,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { AiOutlineHome } from "react-icons/ai";

import { NeuralNetworkIcon } from "./UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { Mode, SelectedData, HovereInstance, Prob } from "../views/Embeddings";
import ScatterPlot from "./ScatterPlot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./UI/select";

const VIEW_MODES: ViewModeType[] = [
  "All Instances",
  "Unlearning Target",
  "Unlearning Failed",
];

export type ViewModeType =
  | "All Instances"
  | "Unlearning Target"
  | "Unlearning Failed";

interface Props {
  mode: Mode;
  height: number;
  data: SelectedData;
  onHover: (imgIdxOrNull: number | null, source?: Mode, prob?: Prob) => void;
  hoveredInstance: HovereInstance | null;
}

const Embedding = forwardRef(
  ({ mode, height, data, onHover, hoveredInstance }: Props, ref) => {
    const { baseline, comparison } = useContext(BaselineComparisonContext);

    const [viewMode, setViewMode] = useState<ViewModeType>(VIEW_MODES[0]);
    const scatterRef = useRef(null);

    const isBaseline = mode === "Baseline";
    const id = isBaseline ? baseline : comparison;
    const idExist = id !== "";
    const symbolStyle = isBaseline
      ? "mr-1 text-purple-500"
      : "mr-1 text-orange-500";

    useEffect(() => {
      setViewMode(VIEW_MODES[0]);
    }, [id]);

    useImperativeHandle(ref, () => ({
      getInstancePosition: (imgIdx: number) => {
        if (scatterRef.current) {
          return (scatterRef.current as any).getInstancePosition(imgIdx);
        }
        return null;
      },
      reset: () => {
        if (scatterRef.current) {
          (scatterRef.current as any).reset();
        }
      },
    }));

    const handleResetClick = () => {
      if (scatterRef.current) {
        (scatterRef.current as any).reset();
      }
    };

    return (
      <div
        style={{ height }}
        className="flex flex-col justify-start items-center relative"
      >
        {idExist && (
          <div>
            <AiOutlineHome
              className="mr-1 cursor-pointer absolute top-2 left-0 z-10"
              onClick={handleResetClick}
            />
            <div className="flex items-center absolute z-10 right-0 top-6">
              <span className="mr-1.5 text-sm">Focus on:</span>
              <Select
                value={viewMode}
                defaultValue={VIEW_MODES[0]}
                onValueChange={(value: ViewModeType) => setViewMode(value)}
              >
                <SelectTrigger className="w-36 h-6">
                  <SelectValue placeholder={0} />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_MODES.map((viewMode, idx) => (
                    <SelectItem key={idx} value={viewMode}>
                      {viewMode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="text-[15px] mt-1 flex items-center">
          <NeuralNetworkIcon className={symbolStyle} />
          <span>
            {mode} {idExist ? `(${id})` : ""}
          </span>
        </div>
        <div className="w-[638px] h-[607px] flex flex-col justify-center items-center">
          <ScatterPlot
            mode={mode}
            data={data}
            viewMode={viewMode}
            onHover={onHover}
            hoveredInstance={hoveredInstance}
            ref={scatterRef}
          />
        </div>
      </div>
    );
  }
);

export default React.memo(Embedding);
