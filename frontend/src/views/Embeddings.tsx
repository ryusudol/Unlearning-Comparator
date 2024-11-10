import {
  useState,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { ExperimentsContext } from "../store/experiments-context";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import Embedding from "../components/Embedding";
import ConnectionLine from "../components/ConnectionLine";
import { Separator } from "../components/UI/separator";
import { TABLEAU10 } from "../constants/tableau10";
import { forgetClassNames } from "../constants/forgetClassNames";
import { extractSelectedData } from "../util";
import {
  HelpCircleIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  ScrollVerticalIcon,
} from "../components/UI/icons";

type Position = { x: number; y: number } | null;
export type Mode = "Baseline" | "Comparison";
export type Instance = { imgIdx: number; source: Mode } | null;
export type Prob = { [key: string]: number };
export type SelectedData = (number | Prob)[][];

export default function Embeddings({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClass } = useContext(ForgetClassContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const [hoveredInstance, setHoveredInstance] = useState<Instance>(null);
  const [fromPosition, setFromPosition] = useState<Position>(null);
  const [toPosition, setToPosition] = useState<Position>(null);

  const baselineRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);

  const handleHover = useCallback(
    (imgIdxOrNull: number | null, source?: Mode) => {
      if (imgIdxOrNull === null) {
        setHoveredInstance(null);
        setFromPosition(null);
        setToPosition(null);
      } else if (typeof imgIdxOrNull === "number" && source) {
        setHoveredInstance({ imgIdx: imgIdxOrNull, source });
      }
    },
    []
  );

  useEffect(() => {
    if (hoveredInstance) {
      const { imgIdx, source } = hoveredInstance;
      const targetRef = source === "Baseline" ? comparisonRef : baselineRef;
      const currentRef = source === "Baseline" ? baselineRef : comparisonRef;
      if (targetRef.current && currentRef.current) {
        const targetPosition = targetRef.current.getInstancePosition(imgIdx);
        const currentPosition = currentRef.current.getInstancePosition(imgIdx);
        if (targetPosition && currentPosition) {
          setFromPosition(currentPosition);
          setToPosition(targetPosition);
        } else {
          setFromPosition(null);
          setToPosition(null);
        }
      }
    } else {
      setFromPosition(null);
      setToPosition(null);
    }
  }, [hoveredInstance]);

  const extractedBaselineData = useMemo(
    () => extractSelectedData(baselineExperiment),
    [baselineExperiment]
  );
  const extractedComparisonData = useMemo(
    () => extractSelectedData(comparisonExperiment),
    [comparisonExperiment]
  );

  return (
    <div className="w-[1538px] h-[715px] flex justify-start px-1.5 items-center border-[1px] border-solid rounded-b-[6px] rounded-tr-[6px]">
      <ConnectionLine from={fromPosition} to={toPosition} />
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
        id={baseline}
        onHover={handleHover}
        hoveredImgIdx={hoveredInstance?.imgIdx ?? null}
        ref={baselineRef}
      />
      <Separator orientation="vertical" className="h-[702px] w-[1px] mx-2.5" />
      <Embedding
        mode="Comparison"
        height={height}
        data={extractedComparisonData}
        id={comparison}
        onHover={handleHover}
        hoveredImgIdx={hoveredInstance?.imgIdx ?? null}
        ref={comparisonRef}
      />
    </div>
  );
}
