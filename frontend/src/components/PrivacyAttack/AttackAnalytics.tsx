import {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { createRoot } from "react-dom/client";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import Tooltip from "../Tooltip";
import { Prob } from "../../types/embeddings";
import { API_URL } from "../../constants/common";
import { useForgetClass } from "../../hooks/useForgetClass";
import { ENTROPY, UNLEARN, Metric } from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { ExperimentsContext } from "../../store/experiments-context";
import { AttackResult, AttackResults } from "../../types/data";
import { Image } from "../../types/privacy-attack";
import { fetchFileData } from "../../utils/api/unlearning";
import { fetchAllSubsetImages } from "../../utils/api/privacyAttack";
import { calculateZoom } from "../../utils/util";

const CONFIG = {
  TOOLTIP_WIDTH: 450,
  TOOLTIP_HEIGHT: 274,
} as const;

export type Bin = { img_idx: number; value: number };
export type Data = {
  retrainData: Bin[];
  unlearnData: Bin[];
  lineChartData: AttackResult[];
} | null;
export type CategoryType = "unlearn" | "retrain";
export type TooltipData = {
  img_idx: number;
  value: number;
  type: CategoryType;
};
export type TooltipPosition = { x: number; y: number };

interface Props {
  mode: "Baseline" | "Comparison";
  metric: Metric;
  aboveThreshold: string;
  thresholdStrategy: string;
  strategyCount: number;
  userModified: boolean;
  baselinePoints: (number | Prob)[][];
  comparisonPoints: (number | Prob)[][];
  setThresholdStrategy: (val: string) => void;
  setUserModified: (val: boolean) => void;
}

export default function AttackAnalytics({
  mode,
  metric,
  aboveThreshold,
  thresholdStrategy,
  strategyCount,
  userModified,
  baselinePoints,
  comparisonPoints,
  setThresholdStrategy,
  setUserModified,
}: Props) {
  const { forgetClassNumber } = useForgetClass();

  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [lastThresholdStrategy, setLastThresholdStrategy] = useState("");
  const [attackScore, setAttackScore] = useState(0);
  const [data, setData] = useState<Data>(null);
  const [images, setImages] = useState<Image[]>();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const prevMetricRef = useRef(metric);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<any>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const isBaseline = mode === "Baseline";
  const isMetricEntropy = metric === ENTROPY;
  const isAboveThresholdUnlearn = aboveThreshold === UNLEARN;

  const containerRef = useRef<HTMLDivElement>(null);

  const imageMap = useMemo(() => {
    if (!images) return new Map<number, Image>();
    const map = new Map<number, Image>();
    images.forEach((img) => map.set(img.index, img));
    return map;
  }, [images]);

  const handleThresholdLineDrag = (newThreshold: number) => {
    setThresholdValue(newThreshold);
    setUserModified(true);
  };

  const showTooltip = (event: MouseEvent, content: JSX.Element) => {
    if (!containerRef.current) return;

    if (tooltipRef.current) {
      rootRef.current?.unmount();
      tooltipRef.current.remove();
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const zoom = calculateZoom();

    let xPos = (event.clientX - containerRect.left) / zoom + 10;
    let yPos = (event.clientY - containerRect.top) / zoom + 10;

    if (yPos + CONFIG.TOOLTIP_HEIGHT > containerRect.height / zoom) {
      yPos =
        (event.clientY - containerRect.top) / zoom - CONFIG.TOOLTIP_HEIGHT - 10;
      if (yPos < 0) {
        yPos = 0;
      }
    }

    const tooltipDiv = document.createElement("div");
    tooltipDiv.style.position = "absolute";
    tooltipDiv.style.left = `${xPos}px`;
    tooltipDiv.style.top = `${yPos}px`;
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.backgroundColor = "white";
    tooltipDiv.style.padding = "5px";
    tooltipDiv.style.border = "1px solid rgba(0, 0, 0, 0.25)";
    tooltipDiv.style.borderRadius = "4px";
    tooltipDiv.style.zIndex = "30";
    tooltipDiv.className = "shadow-xl";

    containerRef.current.appendChild(tooltipDiv);
    tooltipRef.current = tooltipDiv;

    rootRef.current = createRoot(tooltipDiv);
    rootRef.current.render(content);
  };

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      rootRef.current?.unmount();
      tooltipRef.current.remove();
      tooltipRef.current = null;
      rootRef.current = null;
    }
  }, []);

  const handleElementClick = async (
    event: React.MouseEvent,
    elementData: Bin & { type: CategoryType }
  ) => {
    event.stopPropagation();

    if (!containerRef.current) return;

    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      const response = await fetch(
        `${API_URL}/image/cifar10/${elementData.img_idx}`,
        {
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tooltip data");
      if (controller.signal.aborted) return;

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const baselinePoint = baselinePoints.find((point) => {
        return typeof point[4] === "number" && point[4] === elementData.img_idx;
      }) as (number | Prob)[];
      const comparisonPoint = comparisonPoints.find((point) => {
        return typeof point[4] === "number" && point[4] === elementData.img_idx;
      }) as (number | Prob)[];

      let current: Prob, opposite: Prob;
      current = (isBaseline ? baselinePoint![5] : comparisonPoint![5]) as Prob;
      opposite = (isBaseline ? comparisonPoint![5] : baselinePoint![5]) as Prob;

      const barChartData = isBaseline
        ? {
            baseline: Array.from({ length: 10 }, (_, idx) => ({
              class: idx,
              value: Number(current[idx] || 0),
            })),
            comparison: Array.from({ length: 10 }, (_, idx) => ({
              class: idx,
              value: Number(opposite[idx] || 0),
            })),
          }
        : {
            baseline: Array.from({ length: 10 }, (_, idx) => ({
              class: idx,
              value: Number(opposite[idx] || 0),
            })),
            comparison: Array.from({ length: 10 }, (_, idx) => ({
              class: idx,
              value: Number(current[idx] || 0),
            })),
          };

      const tooltipContent = (
        <Tooltip
          width={CONFIG.TOOLTIP_WIDTH}
          height={CONFIG.TOOLTIP_HEIGHT}
          imageUrl={imageUrl}
          data={isBaseline ? baselinePoint : comparisonPoint}
          barChartData={barChartData}
          forgetClass={forgetClassNumber}
          isBaseline={isBaseline}
        />
      );

      showTooltip((event as any).nativeEvent || event, tooltipContent);

      return () => {
        URL.revokeObjectURL(imageUrl);
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Failed to fetch tooltip data:", err);
    }
  };

  useEffect(() => {
    const fetchImage = async () => {
      try {
        type Response = { images: Image[] };
        const res: Response = await fetchAllSubsetImages(forgetClassNumber);
        setImages(res.images);
      } catch (error) {
        console.error(`Error fetching subset images: ${error}`);
      }
    };
    fetchImage();
  }, [forgetClassNumber]);

  useEffect(() => {
    const getAttackData = async () => {
      const retrainExperiment = await fetchFileData(
        forgetClassNumber,
        `a00${forgetClassNumber}`
      );
      const experiment = isBaseline ? baselineExperiment : comparisonExperiment;

      if (!retrainExperiment || !experiment) {
        setData({
          retrainData: [],
          unlearnData: [],
          lineChartData: [],
        });
        return;
      }

      let retrainExperimentValues: Bin[] = [];
      let experimentValues: Bin[] = [];

      const retrainAttackValues = retrainExperiment.attack.values;
      const experimentAttackValues = experiment.attack.values;

      retrainAttackValues.forEach((item) => {
        retrainExperimentValues.push({
          img_idx: item.img,
          value: isMetricEntropy ? item.entropy : item.confidence,
        });
      });
      experimentAttackValues.forEach((item) => {
        experimentValues.push({
          img_idx: item.img,
          value: isMetricEntropy ? item.entropy : item.confidence,
        });
      });
      const key =
        `${metric.toLowerCase()}_above_${aboveThreshold}` as keyof AttackResults;
      const lineChartData = experiment.attack.results[key];

      if (!lineChartData) return;

      if (prevMetricRef.current !== metric) {
        setThresholdValue(isMetricEntropy ? 1.25 : 3.75);
        prevMetricRef.current = metric;
      }

      setData({
        retrainData: retrainExperimentValues,
        unlearnData: experimentValues,
        lineChartData,
      });
    };
    getAttackData();
  }, [
    aboveThreshold,
    baselineExperiment,
    comparisonExperiment,
    forgetClassNumber,
    isBaseline,
    isMetricEntropy,
    metric,
  ]);

  useEffect(() => {
    setUserModified(false);
  }, [thresholdStrategy, strategyCount, setUserModified]);

  useEffect(() => {
    if (!data || thresholdStrategy === "") return;

    if (thresholdStrategy === THRESHOLD_STRATEGIES[0].strategy) {
      const maxAttackData = data.lineChartData.reduce(
        (prev, curr) => (curr.attack_score > prev.attack_score ? curr : prev),
        data.lineChartData[0]
      );
      if (maxAttackData && maxAttackData.threshold !== thresholdValue) {
        setThresholdValue(maxAttackData.threshold);
      }
    } else if (thresholdStrategy === THRESHOLD_STRATEGIES[1].strategy) {
      const allValues = [...data.retrainData, ...data.unlearnData];
      if (allValues.length === 0) return;
      const step = isMetricEntropy ? 0.05 : 0.25;
      const candidateSet = new Set<number>();
      allValues.forEach((datum) => {
        const base = Math.floor(datum.value / step) * step;
        candidateSet.add(base);
        candidateSet.add(base + step);
      });
      const candidates = Array.from(candidateSet).sort((a, b) => a - b);
      let bestCandidate = thresholdValue;
      let bestSuccessCount = -Infinity;
      candidates.forEach((candidate) => {
        const successCount = isAboveThresholdUnlearn
          ? data.retrainData.filter((datum) => datum.value < candidate).length +
            data.unlearnData.filter((datum) => datum.value > candidate).length
          : data.retrainData.filter((datum) => datum.value > candidate).length +
            data.unlearnData.filter((datum) => datum.value < candidate).length;

        if (successCount > bestSuccessCount) {
          bestSuccessCount = successCount;
          bestCandidate = candidate;
        }
      });
      if (bestCandidate !== thresholdValue) {
        setThresholdValue(bestCandidate);
      }
    } else if (thresholdStrategy === THRESHOLD_STRATEGIES[2].strategy) {
      const key =
        `${metric.toLowerCase()}_above_${aboveThreshold}` as keyof AttackResults;
      const baselineLineChartData = baselineExperiment
        ? baselineExperiment.attack.results[key] || []
        : [];
      const comparisonLineChartData = comparisonExperiment
        ? comparisonExperiment.attack.results[key] || []
        : [];
      const combinedLineChartData = [
        ...baselineLineChartData,
        ...comparisonLineChartData,
      ];
      if (combinedLineChartData.length === 0) return;
      const thresholdGroups: { [key: number]: number } = {};
      combinedLineChartData.forEach((item) => {
        thresholdGroups[item.threshold] =
          (thresholdGroups[item.threshold] || 0) + item.attack_score;
      });
      const bestThresholdEntry = Object.entries(thresholdGroups).reduce(
        (best, [t, sum]) => {
          const thresholdCandidate = parseFloat(t);
          return sum > best.sum ? { th: thresholdCandidate, sum } : best;
        },
        { th: thresholdValue, sum: -Infinity }
      );
      if (bestThresholdEntry.th !== thresholdValue) {
        setThresholdValue(bestThresholdEntry.th);
      }
    }
    setLastThresholdStrategy(thresholdStrategy);
    setThresholdStrategy("");
  }, [
    aboveThreshold,
    baselineExperiment,
    comparisonExperiment,
    data,
    isAboveThresholdUnlearn,
    isMetricEntropy,
    metric,
    setThresholdStrategy,
    thresholdStrategy,
    thresholdValue,
  ]);

  useEffect(() => {
    const handleClickOutside = () => {
      hideTooltip();
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [hideTooltip]);

  return (
    <div className="relative h-full flex flex-col" ref={containerRef}>
      {data && (
        <>
          <AttackPlot
            mode={mode}
            metric={metric}
            thresholdValue={thresholdValue}
            aboveThreshold={aboveThreshold}
            thresholdStrategy={userModified ? "" : lastThresholdStrategy}
            hoveredId={hoveredId}
            data={data}
            onThresholdLineDrag={handleThresholdLineDrag}
            onUpdateAttackScore={setAttackScore}
            setHoveredId={setHoveredId}
            onElementClick={handleElementClick}
          />
          <AttackSuccessFailure
            mode={mode}
            thresholdValue={thresholdValue}
            aboveThreshold={aboveThreshold}
            thresholdStrategy={userModified ? "" : lastThresholdStrategy}
            hoveredId={hoveredId}
            data={data}
            imageMap={imageMap}
            attackScore={attackScore}
            setHoveredId={setHoveredId}
            onElementClick={handleElementClick}
          />
        </>
      )}
    </div>
  );
}
