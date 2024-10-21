import { useContext } from "react";

import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import Embedding from "../components/Embedding";
import { basicData } from "../constants/basicData";
import { Separator } from "../components/ui/separator";
import { TABLEAU10 } from "../constants/tableau10";
import { forgetClassNames } from "../constants/forgetClassNames";
import {
  HelpCircleIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  ScrollVerticalIcon,
} from "../components/ui/icons";

const COMPONENT_HEIGHT = 712;

export default function Embeddings() {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClass } = useContext(ForgetClassContext);

  const baselineData = basicData.filter((datum) => datum.id === baseline)[0];
  const comparisonData = basicData.filter(
    (datum) => datum.id === comparison
  )[0];

  // [
  //   0: x,
  //   1: y,
  //   2: original class,
  //   3: predicted class,
  //   4:img_idx,
  //   5: forget_class
  // ]
  const BaselineData = baselineData
    ? baselineData.detailed_results.map((result) => {
        return [
          result.umap_embedding[0],
          result.umap_embedding[1],
          result.ground_truth,
          result.predicted_class,
          result.original_index,
          baselineData.forget_class,
        ];
      })
    : undefined;
  const ComparisonData = comparisonData
    ? comparisonData.detailed_results.map((result) => {
        return [
          result.umap_embedding[0],
          result.umap_embedding[1],
          result.ground_truth,
          result.predicted_class,
          result.original_index,
          comparisonData.forget_class,
        ];
      })
    : undefined;

  return (
    <div className="w-[1538px] h-[715px] flex justify-start px-1.5 items-center border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
      <div
        style={{ height: `${COMPONENT_HEIGHT}px` }}
        className="w-[120px] flex flex-col justify-center items-center"
      >
        {/* Legend - Metadata */}
        <div className="w-full h-[128px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <div className="flex items-center">
            <span className="mr-1">Metadata</span>
            <HelpCircleIcon className="cursor-pointer" />
          </div>
          <div className="flex flex-col justify-start items-start">
            <span className="text-[15px] font-light">Methods: UMAP</span>
            <span className="text-[15px] font-light">Points: 2000</span>
            <span className="text-[15px] font-light">Dimension: 8192</span>
            <span className="text-[15px] font-light">Dataset: Training</span>
          </div>
        </div>
        {/* Legend - Controls */}
        <div className="w-full h-[104px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span>Controls</span>
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
        <div className="w-full h-[86px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span>Data Type</span>
          <div>
            <div className="flex items-center text-[15px] font-light">
              <CircleIcon className="scale-75 mr-[6px]" />
              <span>Remain</span>
            </div>
            <div className="flex items-center text-[15px] font-light">
              <MultiplicationSignIcon className="scale-125 mr-[6px]" />
              <span>Forget</span>
            </div>
          </div>
        </div>
        {/* Legend - Predictions */}
        <div className="w-full h-[370px] flex flex-col justify-start items-start pl-2 pr-[2px] py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span className="mb-1.5">Predictions</span>
          <div>
            {forgetClassNames.map((name, idx) => (
              <div key={idx} className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[idx]}` }}
                  className="w-3 h-[30px] mr-[6px]"
                />
                <div className="flex items-center">
                  <span className="text-[15px] font-light">{name}</span>
                  {name === forgetClassNames[forgetClass] ? (
                    <div className="flex items-center ml-0.5">
                      (<MultiplicationSignIcon className="-mx-0.5" />)
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Separator orientation="vertical" className="h-[702px] w-[1px] mx-2.5" />
      <Embedding
        mode="Baseline"
        height={COMPONENT_HEIGHT}
        data={BaselineData}
        id={baseline}
      />
      <Separator orientation="vertical" className="h-[702px] w-[1px] mx-2.5" />
      <Embedding
        mode="Comparison"
        height={COMPONENT_HEIGHT}
        data={ComparisonData}
        id={comparison}
      />
    </div>
  );
}
