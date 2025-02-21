import { useContext, useRef, useCallback, useMemo } from "react";

import InformationButton from "../components/Embeddings/InformationButton";
import ScatterPlot from "../components/Embeddings/ScatterPlot";
import ConnectionLineWrapper from "../components/Embeddings/ConnectionLineWrapper";
import EmbeddingsLegend from "../components/Embeddings/EmbeddingsLegend";
import { HoverInstance, Position, Prob, Mode } from "../types/embeddings";
import { Separator } from "../components/UI/separator";
import { ExperimentsContext } from "../stores/experiments-context";

interface Props {
  baselinePoints: (number | Prob)[][];
  comparisonPoints: (number | Prob)[][];
}

export default function Embeddings({
  baselinePoints,
  comparisonPoints,
}: Props) {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const hoveredInstanceRef = useRef<HoverInstance>(null);
  const positionRef = useRef<Position>({ from: null, to: null });
  const baselineRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);

  const baselineDataMap = useMemo(() => {
    return new Map(baselinePoints.map((point) => [point[2], point]));
  }, [baselinePoints]);
  const comparisonDataMap = useMemo(() => {
    return new Map(comparisonPoints.map((point) => [point[2], point]));
  }, [comparisonPoints]);

  const handleHover = useCallback(
    (imgIdxOrNull: number | null, source?: Mode, prob?: Prob) => {
      if (imgIdxOrNull === null || !source) {
        if (hoveredInstanceRef.current?.imgIdx !== null) {
          const prevImgIdx = hoveredInstanceRef.current?.imgIdx;
          baselineRef.current?.removeHighlight(prevImgIdx);
          comparisonRef.current?.removeHighlight(prevImgIdx);
        }

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

      const oppositeProb = oppositeInstance[6] as Prob;

      hoveredInstanceRef.current = {
        imgIdx: imgIdxOrNull,
        source,
        baselineProb: isBaseline ? prob : oppositeProb,
        comparisonProb: !isBaseline ? prob : oppositeProb,
      };

      baselineRef.current?.updateHoveredInstance(hoveredInstanceRef.current);
      comparisonRef.current?.updateHoveredInstance(hoveredInstanceRef.current);

      if (isBaseline) {
        comparisonRef.current?.highlightInstance(imgIdxOrNull);
      } else {
        baselineRef.current?.highlightInstance(imgIdxOrNull);
      }

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
    <div className="h-[665px] flex items-center border rounded-md px-1.5 rounded-tr-none relative">
      <EmbeddingsLegend />
      <ConnectionLineWrapper positionRef={positionRef} />
      <InformationButton />
      {baselineExperiment && (
        <ScatterPlot
          mode="Baseline"
          modelType={baselineExperiment.Type}
          data={baselinePoints}
          onHover={handleHover}
          hoveredInstance={hoveredInstanceRef.current}
          ref={baselineRef}
        />
      )}
      <Separator orientation="vertical" className="h-[641px] w-[1px] mx-1" />
      {comparisonExperiment && (
        <ScatterPlot
          mode="Comparison"
          modelType={comparisonExperiment.Type}
          data={comparisonPoints}
          onHover={handleHover}
          hoveredInstance={hoveredInstanceRef.current}
          ref={comparisonRef}
        />
      )}
    </div>
  );
}
