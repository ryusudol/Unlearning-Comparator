import { useContext, useMemo, useRef, useCallback } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import { ForgetClassContext } from "../store/forget-class-context";
import Embedding from "../components/Embedding";
import ConnectionLine from "../components/ConnectionLine";
import { Separator } from "../components/UI/separator";
import { TABLEAU10 } from "../constants/tableau10";
import { forgetClassNames } from "../constants/forgetClassNames";
import { extractSelectedData } from "../utils/data/experiments";
import {
  HelpCircleIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  ScrollVerticalIcon,
} from "../components/UI/icons";

type Coordinate = { x: number; y: number };
type Position = {
  from: Coordinate | null;
  to: Coordinate | null;
};
export type Mode = "Baseline" | "Comparison";
export type HovereInstance = {
  imgIdx: number;
  source: Mode;
  baselineProb?: Prob;
  comparisonProb?: Prob;
} | null;
export type Prob = { [key: string]: number };
export type SelectedData = (number | Prob)[][];

export default function Embeddings({ height }: { height: number }) {
  const { forgetClass } = useContext(ForgetClassContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const hoveredInstanceRef = useRef<HovereInstance>(null);
  const positionRef = useRef<Position>({ from: null, to: null });
  const baselineRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);

  const extractedBaselineData = useMemo(
    () => extractSelectedData(baselineExperiment),
    [baselineExperiment]
  );
  const extractedComparisonData = useMemo(
    () => extractSelectedData(comparisonExperiment),
    [comparisonExperiment]
  );

  const handleHover = useCallback(
    (imgIdxOrNull: number | null, source?: Mode, prob?: Prob) => {
      if (imgIdxOrNull === null || !source) {
        hoveredInstanceRef.current = null;
        positionRef.current.from = null;
        positionRef.current.to = null;
        return;
      }

      const oppositeData =
        source === "Baseline" ? extractedComparisonData : extractedBaselineData;

      const oppositeInstance = oppositeData.find((d) => d[4] === imgIdxOrNull);
      if (!oppositeInstance) return;

      const oppositeProb = oppositeInstance[5] as Prob;

      hoveredInstanceRef.current = {
        imgIdx: imgIdxOrNull,
        source,
        baselineProb: source === "Baseline" ? prob : oppositeProb,
        comparisonProb: source === "Comparison" ? prob : oppositeProb,
      };

      const targetRef = source === "Baseline" ? comparisonRef : baselineRef;
      const currentRef = source === "Baseline" ? baselineRef : comparisonRef;

      if (targetRef.current && currentRef.current) {
        const fromPos = currentRef.current.getInstancePosition(imgIdxOrNull);
        const toPos = targetRef.current.getInstancePosition(imgIdxOrNull);

        positionRef.current = {
          from: { ...fromPos },
          to: { ...toPos },
        };
      }
    },
    [extractedBaselineData, extractedComparisonData]
  );

  return (
    <div
      style={{ height }}
      className="w-[1538px] flex justify-start px-1.5 items-center border-[1px] border-solid rounded-b-[6px] rounded-tr-[6px]"
    >
      <ConnectionLine
        from={positionRef.current.from}
        to={positionRef.current.to}
      />
      <div className="w-[120px] flex flex-col justify-center items-center">
        {/* Legend - Metadata */}
        <div className="w-full h-[128px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid rounded-[6px]">
          <div className="flex items-center">
            <span className="mr-1">Metadata</span>
            <HelpCircleIcon className="cursor-pointer" />
          </div>
          <div className="flex flex-col justify-start items-start">
            <span className="text-[15px] font-light">Method: UMAP</span>
            <span className="text-[15px] font-light">Points: 2000</span>
            <span className="text-[15px] font-light">Dimension: 512</span>
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
                  {forgetClass !== undefined &&
                    name === forgetClassNames[forgetClass] && (
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
        data={extractedBaselineData}
        onHover={handleHover}
        hoveredInstance={hoveredInstanceRef.current}
        ref={baselineRef}
      />
      <Separator orientation="vertical" className="h-[702px] w-[1px] mx-2.5" />
      <Embedding
        mode="Comparison"
        height={height}
        data={extractedComparisonData}
        onHover={handleHover}
        hoveredInstance={hoveredInstanceRef.current}
        ref={comparisonRef}
      />
    </div>
  );
}
