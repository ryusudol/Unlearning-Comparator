import React, {
  useState,
  useEffect,
  useContext,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { AiOutlineHome } from "react-icons/ai";

import { CircleIcon, TriangleIcon } from "./UI/icons";
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

    const id = mode === "Baseline" ? baseline : comparison;

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

    const idExist = id !== "";

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
        <div className="text-[17px] mt-1 flex items-center">
          {mode === "Baseline" ? <CircleIcon /> : <TriangleIcon />}
          <span className="ml-1">
            {mode} Model {idExist ? `(${id})` : ""}
          </span>
        </div>
        <div className="w-[672px] h-[672px] flex flex-col justify-center items-center">
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
