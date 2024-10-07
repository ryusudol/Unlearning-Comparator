import { useContext } from "react";

import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import ScatterPlot from "../components/ScatterPlot";
import { basicData } from "../constants/basicData";
import { Separator } from "../components/ui/separator";
import { TABLEAU10 } from "../constants/tableau10";
import {
  HelpCircleIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  ScrollVerticalIcon,
} from "../components/ui/icons";

export const classNames = [
  "airplane",
  "automobile",
  "bird",
  "cat",
  "deer",
  "dog",
  "frog",
  "horse",
  "ship",
  "truck",
];

export default function Embeddings() {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  // [0: x, 1: y, 2: original_class, 3: predicted class, 4:img_idx], 5: forget_class
  const BaselineData = basicData[+baseline].detailed_results.map((result) => {
    return [
      result.umap_embedding[0],
      result.umap_embedding[1],
      result.ground_truth,
      result.predicted_class,
      result.original_index,
      basicData[+baseline].forget_class,
    ];
  });
  const ComparisonData = basicData[+comparison].detailed_results.map(
    (result) => {
      return [
        result.umap_embedding[0],
        result.umap_embedding[1],
        result.ground_truth,
        result.predicted_class,
        result.original_index,
        basicData[+comparison].forget_class,
      ];
    }
  );

  return (
    <div className="w-[1428px] h-[683px] flex justify-evenly items-center border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
      <div className="w-[116px] h-[660px] flex flex-col justify-center items-center">
        {/* Legend - Metadata */}
        <div className="w-full h-[105px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <div className="flex items-center">
            <span className="text-[15px] mr-1">Metadata</span>
            <HelpCircleIcon className="cursor-pointer" />
          </div>
          <div className="flex flex-col justify-start items-start">
            <span className="text-[15px] font-light">Points: 2000</span>
            <span className="text-[15px] font-light">Dimension: 8192</span>
            <span className="text-[15px] font-light">Dataset: Training</span>
          </div>
        </div>
        {/* Legend - Controls */}
        <div className="w-full h-[105px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span className="text-[15px]">Controls</span>
          <div>
            <div className="flex items-center">
              <CursorPointer01Icon className="scale-110 mr-[6px]" />
              <span className="text-[15px] font-light">Details</span>
            </div>
            <div className="flex items-center -my-[2px]">
              <ScrollVerticalIcon className="scale-110 mr-[6px]" />
              <span className="text-[15px] font-light">Zooming</span>
            </div>
            <div className="flex items-center">
              <Drag01Icon className="scale-110 mr-[6px]" />
              <span className="text-[15px] font-light">Panning</span>
            </div>
          </div>
        </div>
        {/* Legend - Data Type */}
        <div className="w-full h-[85px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span className="text-[15px]">Data Type</span>
          <div>
            <div className="flex items-center text-[15px] font-light">
              <MultiplicationSignIcon className="scale-125 mr-[6px]" />
              <span>Forget</span>
            </div>
            <div className="flex items-center text-[15px] font-light">
              <CircleIcon className="scale-75 mr-[6px]" />
              <span>Remain</span>
            </div>
          </div>
        </div>
        {/* Legend - Predictions */}
        <div className="w-full h-[358px] flex flex-col justify-start items-start pl-2 pr-[2px] py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span className="text-[15px]">Predictions</span>
          <div>
            {classNames.map((className, idx) => (
              <div key={idx} className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[idx]}` }}
                  className="w-[14px] h-[30px] mr-1"
                />
                <span className="text-[15px] font-light">
                  {idx} ({className})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Separator
        orientation="vertical"
        className="h-[660px] w-[1px] mx-[2px]"
      />
      <ScatterPlot mode="Baseline" data={BaselineData} />
      <Separator
        orientation="vertical"
        className="h-[660px] w-[1px] mx-[2px]"
      />
      <ScatterPlot mode="Comparison" data={ComparisonData} />
    </div>
  );
}
