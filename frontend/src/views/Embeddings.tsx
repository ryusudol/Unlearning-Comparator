import {
  useContext,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";

import View from "../components/View";
import InformationButton from "../components/Embeddings/InformationButton";
import ScatterPlot from "../components/Embeddings/ScatterPlot";
import ConnectionLineWrapper from "../components/Embeddings/ConnectionLineWrapper";
import { CircleIcon, FatMultiplicationSignIcon } from "../components/UI/icons";
import { HoverInstance, Position, Prob, Mode } from "../types/embeddings";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { processPointsData } from "../utils/data/experiments";
import { useForgetClass } from "../hooks/useForgetClass";
import { fetchFileData } from "../utils/api/unlearning";
import { Separator } from "../components/UI/separator";
import { CIFAR_10_CLASSES } from "../constants/common";
import { TABLEAU10 } from "../constants/colors";
import { Point } from "../types/data";

export default function Embeddings({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const { forgetClassNumber } = useForgetClass();

  const [baselinePoints, setBaselinePoints] = useState<Point[]>([]);
  const [comparisonPoints, setComparisonPoints] = useState<Point[]>([]);

  const hoveredInstanceRef = useRef<HoverInstance>(null);
  const positionRef = useRef<Position>({ from: null, to: null });
  const baselineRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);

  useEffect(() => {
    async function loadBaselineData() {
      if (!baseline) return;
      try {
        const data = await fetchFileData(forgetClassNumber, baseline);
        setBaselinePoints(data.points);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Failed to fetch an unlearned data file: ${error.message}`);
        } else {
          alert(
            "An unknown error occurred while fetching an unlearned data file . . ."
          );
        }
        setBaselinePoints([]);
      }
    }
    loadBaselineData();
  }, [baseline, forgetClassNumber]);

  useEffect(() => {
    async function loadComparisonData() {
      if (!comparison) return;
      try {
        const data = await fetchFileData(forgetClassNumber, comparison);
        setComparisonPoints(data.points);
      } catch (error) {
        console.error("Error fetching comparison file data:", error);
        setComparisonPoints([]);
      }
    }
    loadComparisonData();
  }, [comparison, forgetClassNumber]);

  const processedBaselinePoints = useMemo(
    () => processPointsData(baselinePoints),
    [baselinePoints]
  );
  const processedComparisonPoints = useMemo(
    () => processPointsData(comparisonPoints),
    [comparisonPoints]
  );

  const baselineDataMap = useMemo(() => {
    return new Map(processedBaselinePoints.map((d) => [d[4], d]));
  }, [processedBaselinePoints]);
  const comparisonDataMap = useMemo(() => {
    return new Map(processedComparisonPoints.map((d) => [d[4], d]));
  }, [processedComparisonPoints]);

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

      const oppositeProb = oppositeInstance[5] as Prob;

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
    <View
      height={height}
      className="w-full flex items-center rounded-[6px] px-1.5 rounded-tr-none"
    >
      <EmbeddingsLegend />
      <ConnectionLineWrapper positionRef={positionRef} />
      <InformationButton />
      <ScatterPlot
        mode="Baseline"
        height={height}
        data={processedBaselinePoints}
        onHover={handleHover}
        hoveredInstance={hoveredInstanceRef.current}
        ref={baselineRef}
      />
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <ScatterPlot
        mode="Comparison"
        height={height}
        data={processedComparisonPoints}
        onHover={handleHover}
        hoveredInstance={hoveredInstanceRef.current}
        ref={comparisonRef}
      />
    </View>
  );
}

function EmbeddingsLegend() {
  const { forgetClass } = useForgetClass();

  return (
    <div className="flex items-center bg-white border border-b-white rounded-t-[6px] px-2 py-1 absolute -top-[30px] -right-[1px] text-sm z-10">
      <div className="flex items-center mr-4">
        <span className="font-medium mr-2.5">Data Type</span>
        <ul className="flex items-center gap-[9.2px]">
          <li className="flex items-center">
            <CircleIcon className="w-[9px] h-[9px] text-[#4f5562] mr-[3px]" />
            <span>Remaining Data</span>
          </li>
          <li className="flex items-center">
            <FatMultiplicationSignIcon className="text-[#4f5562] mr-[3px]" />
            <span>Forgetting Target</span>
          </li>
        </ul>
      </div>
      <div className="flex items-center">
        <span className="font-medium mr-2.5">Prediction</span>
        <ul className="flex items-center gap-2">
          {CIFAR_10_CLASSES.map((name, idx) => (
            <li key={idx} className="flex items-center">
              <div
                style={{ backgroundColor: TABLEAU10[idx] }}
                className="w-3.5 h-3.5 mr-[3px]"
              />
              <span>{forgetClass === idx ? name + " (X)" : name}</span>
            </li>
          ))}
        </ul>
      </div>
      <Separator
        orientation="horizontal"
        className="absolute bottom-[1px] h-[1px] w-[calc(100%-16px)]"
      />
    </div>
  );
}
