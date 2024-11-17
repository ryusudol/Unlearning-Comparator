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
      className="w-[calc(100%)] flex justify-start px-1.5 items-center border-[1px] border-solid rounded-[6px]"
    >
      <ConnectionLine
        from={positionRef.current.from}
        to={positionRef.current.to}
      />
      <div className="w-[108px] flex flex-col justify-center items-center">
        {/* Legend - Metadata */}
        <div className="w-full h-[112px] flex flex-col justify-start items-start mb-[5px] p-1 border-[1px] border-solid rounded-[6px]">
          <div className="flex items-center">
            <span className="mr-1 text-[15px]">Metadata</span>
            <HelpCircleIcon className="cursor-pointer" />
          </div>
          <div className="flex flex-col justify-start items-start text-sm font-light text-nowrap">
            <span>Method: UMAP</span>
            <span>Points: 2000</span>
            <span>Dimension: 512</span>
            <span>Dataset: Training</span>
          </div>
        </div>
        {/* Legend - Controls */}
        <div className="w-full h-[88px] flex flex-col justify-start items-start mb-[5px] p-1 border-[1px] border-solid rounded-[6px]">
          <span className="text-[15px]">Controls</span>
          <div className="text-sm font-light">
            <div className="flex items-center">
              <CursorPointer01Icon className="scale-110 mr-[6px]" />
              <span>Details</span>
            </div>
            <div className="flex items-center -my-[2px]">
              <ScrollVerticalIcon className="scale-110 mr-[6px]" />
              <span>Zooming</span>
            </div>
            <div className="flex items-center">
              <Drag01Icon className="scale-110 mr-[6px]" />
              <span>Panning</span>
            </div>
          </div>
        </div>
        {/* Legend - Data Type */}
        <div className="w-full h-[72px] flex flex-col justify-start items-start mb-[5px] p-1 border-[1px] border-solid rounded-[6px]">
          <span className="text-[15px]">Data Type</span>
          <div className="text-sm font-light">
            <div className="flex items-center">
              <CircleIcon className="scale-75 mr-[6px]" />
              <span>Remain</span>
            </div>
            <div className="flex items-center">
              <MultiplicationSignIcon className="scale-125 mr-[6px]" />
              <span>Forget</span>
            </div>
          </div>
        </div>
        {/* Legend - Predictions */}
        <div className="w-full h-[326px] flex flex-col justify-start items-start p-1 pr-0.5 border-[1px] border-solid rounded-[6px]">
          <span className="text-[15px] mb-1">Predictions</span>
          <div>
            {forgetClassNames.map((name, idx) => (
              <div key={idx} className="flex items-center mb-0.5">
                <div
                  style={{ backgroundColor: `${TABLEAU10[idx]}` }}
                  className="w-2.5 h-[27px] mr-1.5"
                />
                <div className="flex items-center text-sm font-light">
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
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <Embedding
        mode="Baseline"
        height={height}
        data={extractedBaselineData}
        onHover={handleHover}
        hoveredInstance={hoveredInstanceRef.current}
        ref={baselineRef}
      />
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
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
