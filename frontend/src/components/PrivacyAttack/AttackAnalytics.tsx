import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import Tooltip from "./Tooltip";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";
import { Prob } from "../../types/embeddings";
import { API_URL } from "../../constants/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { ENTROPY, UNLEARN, Metric } from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { AttackResult, AttackResults, AttackData } from "../../types/data";
import { fetchAllSubsetImages } from "../../utils/api/privacyAttack";
import { calculateZoom } from "../../utils/util";

const CONFIG = {
  TOOLTIP_WIDTH: 450,
  TOOLTIP_HEIGHT: 274,
} as const;

export interface Bin {
  img_idx: number;
  value: number;
}
export type Data = {
  retrainData: Bin[];
  unlearnData: Bin[];
  lineChartData: AttackResult[];
} | null;
export type CategoryType = "unlearn" | "retrain";
export interface Image {
  index: number;
  base64: string;
}
export interface TooltipData {
  img_idx: number;
  value: number;
  type: CategoryType;
}
export interface TooltipPosition {
  x: number;
  y: number;
}

interface Props {
  mode: "Baseline" | "Comparison";
  metric: Metric;
  aboveThreshold: string;
  thresholdStrategy: string;
  strategyCount: number;
  userModified: boolean;
  retrainPoints: (number | Prob)[][];
  unlearnPoints: (number | Prob)[][];
  retrainAttackData: AttackData;
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
  retrainPoints,
  unlearnPoints,
  retrainAttackData,
  setThresholdStrategy,
  setUserModified,
}: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

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

  const handleElementClick = useCallback(
    async (
      event: React.MouseEvent,
      elementData: Bin & { type: CategoryType }
    ) => {
      event.stopPropagation();

      if (
        !containerRef.current ||
        retrainPoints.length === 0 ||
        unlearnPoints.length === 0
      ) {
        return;
      }

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

        const retrainPoint = retrainPoints.find((point) => {
          return point[2] === elementData.img_idx;
        }) as (number | Prob)[];
        const unlearnPoint = unlearnPoints.find((point) => {
          return point[2] === elementData.img_idx;
        }) as (number | Prob)[];

        const retrainProb = retrainPoint![6] as Prob;
        const unlearnProb = unlearnPoint![6] as Prob;

        const barChartData = isBaseline
          ? {
              baseline: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(retrainProb[idx] || 0),
              })),
              comparison: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(unlearnProb[idx] || 0),
              })),
            }
          : {
              baseline: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(unlearnProb[idx] || 0),
              })),
              comparison: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(retrainProb[idx] || 0),
              })),
            };

        const tooltipContent = (
          <Tooltip
            width={CONFIG.TOOLTIP_WIDTH}
            height={CONFIG.TOOLTIP_HEIGHT}
            imageUrl={imageUrl}
            data={unlearnPoint}
            barChartData={barChartData}
            isBaseline={isBaseline}
          />
        );

        showTooltip((event as any).nativeEvent || event, tooltipContent);

        return () => {
          URL.revokeObjectURL(imageUrl);
        };
      } catch (error) {
        console.error(`Failed to fetch tooltip data: ${error}`);
      }
    },
    [isBaseline, retrainPoints, unlearnPoints]
  );

  useEffect(() => {
    const fetchImage = async () => {
      try {
        type Response = { images: Image[] };
        const res: Response = await fetchAllSubsetImages(forgetClass);
        setImages(res.images);
      } catch (error) {
        console.error(`Error fetching subset images: ${error}`);
      }
    };
    fetchImage();
  }, [forgetClass]);

  useEffect(() => {
    const getAttackData = async () => {
      const experiment = isBaseline ? modelAExperiment : modelBExperiment;

      if (!retrainAttackData || !experiment) {
        setData({
          retrainData: [],
          unlearnData: [],
          lineChartData: [],
        });
        return;
      }

      let retrainExperimentValues: Bin[] = [];
      let experimentValues: Bin[] = [];

      const retrainAttackValues = retrainAttackData.values;
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
    isBaseline,
    isMetricEntropy,
    metric,
    modelAExperiment,
    modelBExperiment,
    retrainAttackData,
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
      const baselineLineChartData = modelAExperiment
        ? modelAExperiment.attack.results[key] || []
        : [];
      const comparisonLineChartData = modelBExperiment
        ? modelBExperiment.attack.results[key] || []
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
    data,
    isAboveThresholdUnlearn,
    isMetricEntropy,
    metric,
    modelAExperiment,
    modelBExperiment,
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
    <div className="w-[635px] h-full relative flex flex-col" ref={containerRef}>
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
