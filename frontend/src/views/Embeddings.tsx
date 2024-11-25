import { useContext, useMemo, useRef, useCallback } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import ScatterPlot from "../components/ScatterPlot";
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

  const baselineDataMap = useMemo(() => {
    return new Map(extractedBaselineData.map((d) => [d[4], d]));
  }, [extractedBaselineData]);
  const comparisonDataMap = useMemo(() => {
    return new Map(extractedComparisonData.map((d) => [d[4], d]));
  }, [extractedComparisonData]);
  console.log("Embeddings!");
  const handleHover = useCallback(
    (imgIdxOrNull: number | null, source?: Mode, prob?: Prob) => {
      if (imgIdxOrNull === null || !source) {
        positionRef.current = { from: null, to: null };
        hoveredInstanceRef.current = null;

        baselineRef.current?.updateHoveredInstance(null);
        comparisonRef.current?.updateHoveredInstance(null);
        return;
      }

      const isBaseline = source === "Baseline";
      const oppositeInstance = isBaseline
        ? comparisonDataMap.get(imgIdxOrNull)
        : baselineDataMap.get(imgIdxOrNull);

      if (!oppositeInstance) return;

      const oppositeProb = oppositeInstance[5] as Prob;

      hoveredInstanceRef.current = {
        imgIdx: imgIdxOrNull,
        source,
        baselineProb: isBaseline ? prob : oppositeProb,
        comparisonProb: !isBaseline ? prob : oppositeProb,
      };

      baselineRef.current?.updateHoveredInstance(hoveredInstanceRef.current);
      comparisonRef.current?.updateHoveredInstance(hoveredInstanceRef.current);

      const targetRef = isBaseline ? comparisonRef : baselineRef;
      const currentRef = isBaseline ? baselineRef : comparisonRef;

      if (targetRef.current && currentRef.current) {
        const fromPos = currentRef.current.getInstancePosition(imgIdxOrNull);
        const toPos = targetRef.current.getInstancePosition(imgIdxOrNull);

        positionRef.current = {
          from: { ...fromPos },
          to: { ...toPos },
        };
      }
    },
    [baselineDataMap, comparisonDataMap]
  );

  return (
    <div
      style={{ height }}
      className="w-full flex justify-start px-1.5 items-center border-[1px] border-solid rounded-[6px] rounded-tr-none"
    >
      <ConnectionLine
        from={positionRef.current.from}
        to={positionRef.current.to}
      />
      <ScatterPlot
        mode="Baseline"
        height={height}
        data={extractedBaselineData}
        onHover={handleHover}
        hoveredInstance={hoveredInstanceRef.current}
        ref={baselineRef}
      />
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <ScatterPlot
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
