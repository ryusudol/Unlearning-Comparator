import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import Tooltip from "./Tooltip";
import {
  ENTROPY,
  UNLEARN,
  RETRAIN,
  CONFIDENCE,
  Metric,
} from "../../views/PrivacyAttack";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";
import { API_URL } from "../../constants/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { AttackResult, AttackResults, AttackData } from "../../types/data";
import { Bin, Data, CategoryType, Image } from "../../types/attack";
import { Prob } from "../../types/embeddings";
import { fetchAllSubsetImages } from "../../utils/api/privacyAttack";
import { calculateZoom } from "../../utils/util";

const CONFIG = {
  TOOLTIP_WIDTH: 450,
  TOOLTIP_HEIGHT: 274,
} as const;

interface Props {
  mode: "A" | "B";
  metric: Metric;
  direction: string;
  strategy: string;
  retrainPoints: (number | Prob)[][];
  modelPoints: (number | Prob)[][];
  retrainAttackData: AttackData;
  onUpdateMetric: (val: Metric) => void;
  onUpdateDirection: (val: string) => void;
}

export default function AttackAnalytics({
  mode,
  metric,
  direction,
  strategy,
  retrainPoints,
  modelPoints,
  retrainAttackData,
  onUpdateMetric,
  onUpdateDirection,
}: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [attackScore, setAttackScore] = useState(0);
  const [data, setData] = useState<Data>(null);
  const [images, setImages] = useState<Image[]>();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [autoUpdated, setAutoUpdated] = useState(false);

  const prevMetricRef = useRef(metric);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<any>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const isModelA = mode === "A";
  const isMetricEntropy = metric === ENTROPY;
  const isAboveThresholdUnlearn = direction === UNLEARN;

  const containerRef = useRef<HTMLDivElement>(null);

  const imageMap = useMemo(() => {
    if (!images) return new Map<number, Image>();
    const map = new Map<number, Image>();
    images.forEach((img) => map.set(img.index, img));
    return map;
  }, [images]);

  const handleThresholdLineDrag = (newThreshold: number) => {
    if (strategy === THRESHOLD_STRATEGIES[0].strategy) {
      setThresholdValue(newThreshold);
    }
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
        modelPoints.length === 0
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
        const unlearnPoint = modelPoints.find((point) => {
          return point[2] === elementData.img_idx;
        }) as (number | Prob)[];

        const retrainProb = retrainPoint![6] as Prob;
        const unlearnProb = unlearnPoint![6] as Prob;

        const barChartData = {
          modelA: Array.from({ length: 10 }, (_, idx) => ({
            class: idx,
            value: Number(retrainProb[idx] || 0),
          })),
          modelB: Array.from({ length: 10 }, (_, idx) => ({
            class: idx,
            value: Number(unlearnProb[idx] || 0),
          })),
        };

        const tooltipContent = (
          <Tooltip
            width={CONFIG.TOOLTIP_WIDTH}
            height={CONFIG.TOOLTIP_HEIGHT}
            imageUrl={imageUrl}
            data={unlearnPoint}
            barChartData={barChartData}
            isModelA={isModelA}
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
    [isModelA, retrainPoints, modelPoints]
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
      const experiment = isModelA ? modelAExperiment : modelBExperiment;

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
        `${metric.toLowerCase()}_above_${direction}` as keyof AttackResults;
      const lineChartData = experiment.attack.results[key];

      if (!lineChartData) return;

      if (prevMetricRef.current !== metric) {
        if (!strategy.startsWith("BEST_ATTACK")) {
          setThresholdValue(isMetricEntropy ? 1.25 : 3.75);
        }
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
    direction,
    isMetricEntropy,
    isModelA,
    metric,
    modelAExperiment,
    modelBExperiment,
    retrainAttackData,
    strategy,
  ]);

  useEffect(() => {
    const defaultThreshold = isMetricEntropy ? 1.25 : 3.75;
    const validRange = isMetricEntropy
      ? { min: 0, max: 2.5 }
      : { min: -2.5, max: 10 };
    if (thresholdValue < validRange.min || thresholdValue > validRange.max) {
      setThresholdValue(defaultThreshold);
    }
  }, [isMetricEntropy, thresholdValue]);

  const findMaxAttackData = (lineData: AttackResult[]) => {
    return lineData.reduce(
      (prev, curr) => (curr.attack_score > prev.attack_score ? curr : prev),
      lineData[0]
    );
  };

  useEffect(() => {
    if (!data) return;

    if (strategy.startsWith("BEST_ATTACK")) {
      const isModelAButton = strategy.endsWith("A");
      if ((isModelAButton && isModelA) || (!isModelAButton && !isModelA)) {
        let bestResult = {
          metric,
          direction,
          threshold: thresholdValue,
          attack_score: 0,
        };
        const metrics: Metric[] = [ENTROPY, CONFIDENCE];
        const directions = [UNLEARN, RETRAIN];
        metrics.forEach((m) => {
          directions.forEach((d) => {
            const key = `${m}_above_${d}` as keyof AttackResults;
            const experimentAttackData = isModelAButton
              ? modelAExperiment
              : modelBExperiment;
            const lineData = experimentAttackData
              ? experimentAttackData.attack.results[key] || []
              : [];
            if (lineData.length > 0) {
              const maxAttackData = findMaxAttackData(lineData);
              if (maxAttackData.attack_score > bestResult.attack_score) {
                bestResult = {
                  metric: m,
                  direction: d,
                  threshold: maxAttackData.threshold,
                  attack_score: maxAttackData.attack_score,
                };
              }
            }
          });
        });

        if (!autoUpdated) {
          onUpdateMetric(bestResult.metric);
          onUpdateDirection(bestResult.direction);
          if (bestResult.threshold !== thresholdValue) {
            setThresholdValue(bestResult.threshold);
          }
          setAutoUpdated(true);
        }
      }
    } else {
      if (autoUpdated) setAutoUpdated(false);

      if (strategy === THRESHOLD_STRATEGIES[1].strategy) {
        const maxAttackData = findMaxAttackData(data.lineChartData);
        if (maxAttackData && maxAttackData.threshold !== thresholdValue) {
          setThresholdValue(maxAttackData.threshold);
        }
      } else if (strategy === THRESHOLD_STRATEGIES[2].strategy) {
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
            ? data.retrainData.filter((datum) => datum.value < candidate)
                .length +
              data.unlearnData.filter((datum) => datum.value > candidate).length
            : data.retrainData.filter((datum) => datum.value > candidate)
                .length +
              data.unlearnData.filter((datum) => datum.value < candidate)
                .length;

          if (successCount > bestSuccessCount) {
            bestSuccessCount = successCount;
            bestCandidate = candidate;
          }
        });
        if (bestCandidate !== thresholdValue) {
          setThresholdValue(bestCandidate);
        }
      } else if (strategy === THRESHOLD_STRATEGIES[3].strategy) {
        const key =
          `${metric.toLowerCase()}_above_${direction}` as keyof AttackResults;
        const modelALineChartData = modelAExperiment
          ? modelAExperiment.attack.results[key] || []
          : [];
        const modelBLineChartData = modelBExperiment
          ? modelBExperiment.attack.results[key] || []
          : [];
        const combinedLineChartData = [
          ...modelALineChartData,
          ...modelBLineChartData,
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
    }
  }, [
    autoUpdated,
    data,
    direction,
    isAboveThresholdUnlearn,
    isMetricEntropy,
    isModelA,
    metric,
    modelAExperiment,
    modelBExperiment,
    onUpdateDirection,
    onUpdateMetric,
    strategy,
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
            direction={direction}
            strategy={strategy}
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
            direction={direction}
            strategy={strategy}
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
