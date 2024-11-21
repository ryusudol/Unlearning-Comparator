import { useContext, useMemo, useRef, useCallback } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import Embedding from "../components/Embedding";
import ConnectionLine from "../components/ConnectionLine";
import { Separator } from "../components/UI/separator";
import { extractSelectedData } from "../utils/data/experiments";

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
      className="w-full flex justify-start px-1.5 items-center border-[1px] border-solid rounded-[6px]"
    >
      <ConnectionLine
        from={positionRef.current.from}
        to={positionRef.current.to}
      />
      {/* <div className="w-[108px] flex flex-col justify-center items-center">
        <div className="w-full h-[72px] flex flex-col justify-start items-start mb-[5px] px-1 py-0.5 border-[1px] border-solid rounded-[6px]">
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
        <div className="w-full h-[326px] flex flex-col justify-start items-start px-1 py-0.5 pr-0.5 border-[1px] border-solid rounded-[6px]">
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
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" /> */}
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
