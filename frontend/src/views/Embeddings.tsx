import { useContext, useMemo } from "react";

import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import Embedding from "../components/Embedding";
import { basicData } from "../constants/basicData";
import { Separator } from "../components/UI/separator";
import { TABLEAU10 } from "../constants/tableau10";
import { forgetClassNames } from "../constants/forgetClassNames";
import {
  HelpCircleIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  ScrollVerticalIcon,
} from "../components/UI/icons";

export default function Embeddings({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClass } = useContext(ForgetClassContext);

  const baselineData = useMemo(() => {
    return basicData.find((datum) => datum.id === baseline);
  }, [baseline]);
  const comparisonData = useMemo(() => {
    return basicData.find((datum) => datum.id === comparison);
  }, [comparison]);

  // [
  //   0: x,
  //   1: y,
  //   2: original class,
  //   3: predicted class,
  //   4:img_idx,
  //   5: forget_class
  // ]
  const BaselineData = useMemo(() => {
    return baselineData
      ? baselineData.detailed_results.map((result) => [
          result.umap_embedding[0],
          result.umap_embedding[1],
          result.ground_truth,
          result.predicted_class,
          result.original_index,
          baselineData.forget_class,
        ])
      : undefined;
  }, [baselineData]);
  const ComparisonData = useMemo(() => {
    return comparisonData
      ? comparisonData.detailed_results.map((result) => [
          result.umap_embedding[0],
          result.umap_embedding[1],
          result.ground_truth,
          result.predicted_class,
          result.original_index,
          comparisonData.forget_class,
        ])
      : undefined;
  }, [comparisonData]);

  return (
    <div className="w-[1538px] h-[715px] flex justify-start px-1.5 items-center border-[1px] border-solid rounded-b-[6px] rounded-tr-[6px]">
      <div className="w-[120px] flex flex-col justify-center items-center">
        {/* Legend - Metadata */}
        <div className="w-full h-[128px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid rounded-[6px]">
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
        <div className="w-full h-[104px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid rounded-[6px]">
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
        <div className="w-full h-[86px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid rounded-[6px]">
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
        <div className="w-full h-[370px] flex flex-col justify-start items-start pl-2 pr-0.5 py-[5px] border-[1px] border-solid rounded-[6px]">
          <span className="mb-1.5">Predictions</span>
          <div>
            {forgetClassNames.map((name, idx) => (
              <div key={idx} className="flex items-center mb-0.5">
                <div
                  style={{ backgroundColor: `${TABLEAU10[idx]}` }}
                  className="w-3 h-[30px] mr-1.5"
                />
                <div className="flex items-center text-[15px] font-light">
                  <span>{name}</span>
                  {forgetClass && name === forgetClassNames[forgetClass] && (
                    <span className="ml-0.5">(X)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Separator orientation="vertical" className="h-[702px] w-[1px] mx-2.5" />
      <Embedding
        mode="Baseline"
        height={height}
        data={BaselineData}
        id={baseline}
      />
      <Separator orientation="vertical" className="h-[702px] w-[1px] mx-2.5" />
      <Embedding
        mode="Comparison"
        height={height}
        data={ComparisonData}
        id={comparison}
      />
    </div>
  );
}
