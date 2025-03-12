import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import Tooltip from "./Tooltip";
import { API_URL } from "../../constants/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useAttackStateStore } from "../../stores/attackStore";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { AttackResult, AttackResults, AttackData } from "../../types/data";
import { Bin, Data, CategoryType, Image } from "../../types/attack";
import { Prob } from "../../types/embeddings";
import { fetchAllSubsetImages } from "../../utils/api/privacyAttack";
import { calculateZoom } from "../../utils/util";
import { useModelDataStore } from "../../stores/modelDataStore";
import { ENTROPY, UNLEARN, RETRAIN, CONFIDENCE } from "../../constants/common";
import { useThresholdStore } from "../../stores/thresholdStore";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";

const CONFIG = {
  TOOLTIP_WIDTH: 450,
  TOOLTIP_HEIGHT: 274,
} as const;

interface Props {
  mode: "A" | "B";
  retrainPoints: (number | Prob)[][];
  modelPoints: (number | Prob)[][];
  retrainAttackData: AttackData;
}

export default function AttackAnalytics({
  mode,
  retrainPoints,
  modelPoints,
  retrainAttackData,
}: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();
  const { strategyThresholds, initializeThresholds, setStrategyThresholds } =
    useThresholdStore();
  const {
    metric,
    direction,
    strategy,
    worstCaseModel,
    setMetric,
    setDirection,
    setStrategy,
  } = useAttackStateStore();

  const isModelA = mode === "A";
  const isMetricEntropy = metric === ENTROPY;
  const isAboveThresholdUnlearn = direction === UNLEARN;

  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [attackScore, setAttackScore] = useState(0);
  const [data, setData] = useState<Data>(null);
  const [images, setImages] = useState<Image[]>();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [dataMetric, setDataMetric] = useState(metric);

  const prevMetricRef = useRef(metric);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<any>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const prevModelA = useRef(modelA);
  const prevModelB = useRef(modelB);
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

        const retrainedPoint = retrainPoints.find((point) => {
          return point[2] === elementData.img_idx;
        }) as (number | Prob)[];
        const unlearnedPoint = modelPoints.find((point) => {
          return point[2] === elementData.img_idx;
        }) as (number | Prob)[];

        const retrainProb = retrainedPoint![6] as Prob;
        const unlearnProb = unlearnedPoint![6] as Prob;

        const barChartData = {
          retrainedModelData: Array.from({ length: 10 }, (_, idx) => ({
            class: idx,
            value: Number(retrainProb[idx] || 0),
          })),
          modelData: Array.from({ length: 10 }, (_, idx) => ({
            class: idx,
            value: Number(unlearnProb[idx] || 0),
          })),
        };

        const tooltipContent = (
          <Tooltip
            width={CONFIG.TOOLTIP_WIDTH}
            height={CONFIG.TOOLTIP_HEIGHT}
            imageUrl={imageUrl}
            data={unlearnedPoint}
            barChartData={barChartData}
            isModelA={isModelA}
            clickedType={elementData.type}
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
    initializeThresholds(isMetricEntropy);
  }, [isMetricEntropy, initializeThresholds]);

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
      setDataMetric(metric);
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

  const findMaxAttackData = (lineData: AttackResult[]) => {
    return lineData.reduce(
      (prev, curr) => (curr.attack_score > prev.attack_score ? curr : prev),
      lineData[0]
    );
  };

  // TODO:
  useEffect(() => {
    if (!data) return;

    // 1. Custom
    const customThreshold = isMetricEntropy ? 1.25 : 3.75;

    // 2. Max Attack Score
    let maxAttackScoreThreshold = thresholdValue;
    const maxAttackKey = `${metric}_above_${direction}` as keyof AttackResults;
    const experiment = isModelA ? modelAExperiment : modelBExperiment;
    const attackData = experiment
      ? experiment.attack.results[maxAttackKey] || []
      : [];
    if (attackData.length > 0) {
      const maxAttackData = findMaxAttackData(attackData);
      maxAttackScoreThreshold = maxAttackData.threshold;
    }

    // 3. Max Success Rate
    let maxSuccessRateThreshold = thresholdValue;
    const allValues = [...data.retrainData, ...data.unlearnData];
    if (allValues.length > 0) {
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
      maxSuccessRateThreshold = bestCandidate;
    }

    // 4. Common Threshold
    let commonThreshold = thresholdValue;
    const commonThresholdKey =
      `${metric.toLowerCase()}_above_${direction}` as keyof AttackResults;
    const modelALineChartData = modelAExperiment
      ? modelAExperiment.attack.results[commonThresholdKey] || []
      : [];
    const modelBLineChartData = modelBExperiment
      ? modelBExperiment.attack.results[commonThresholdKey] || []
      : [];
    const combinedLineChartData = [
      ...modelALineChartData,
      ...modelBLineChartData,
    ];
    if (combinedLineChartData.length > 0) {
      const thresholdGroups: { [commonThresholdKey: number]: number } = {};
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
      commonThreshold = bestThresholdEntry.th;
    }

    const newThresholds = [
      customThreshold,
      maxAttackScoreThreshold,
      maxSuccessRateThreshold,
      commonThreshold,
    ];

    const modeKey = isModelA ? "A" : "B";
    const currentThresholds = strategyThresholds[modeKey];
    const isEqual =
      currentThresholds &&
      currentThresholds.length === newThresholds.length &&
      currentThresholds.every((v, i) => v === newThresholds[i]);
    if (isEqual) return;

    setStrategyThresholds(modeKey, newThresholds);
  }, [
    data,
    direction,
    isAboveThresholdUnlearn,
    isMetricEntropy,
    isModelA,
    metric,
    modelAExperiment,
    modelBExperiment,
    setStrategyThresholds,
    strategyThresholds,
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

  useEffect(() => {
    if (prevModelA.current !== modelA || prevModelB.current !== modelB) {
      setMetric(ENTROPY);
      setDirection(UNLEARN);
      setStrategy(THRESHOLD_STRATEGIES[0].strategy);
      prevModelA.current = modelA;
      prevModelB.current = modelB;
    }
  }, [modelA, modelB, setDirection, setMetric, setStrategy]);

  useEffect(() => {
    if (strategy === THRESHOLD_STRATEGIES[0].strategy) {
      setThresholdValue(isMetricEntropy ? 1.25 : 3.75);
    }
  }, [isMetricEntropy, strategy]);

  useEffect(() => {
    if (strategy === "BEST_ATTACK") {
      const isModelAWorstCase = worstCaseModel === "A";
      if (
        (isModelAWorstCase && isModelA) ||
        (!isModelAWorstCase && !isModelA)
      ) {
        let bestResult = {
          metric,
          direction,
          threshold: thresholdValue,
          attack_score: 0,
        };
        const metrics = [ENTROPY, CONFIDENCE];
        const directions = [UNLEARN, RETRAIN];
        metrics.forEach((m) => {
          directions.forEach((d) => {
            const key = `${m}_above_${d}` as keyof AttackResults;
            const experimentAttackData = isModelAWorstCase
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
        setMetric(bestResult.metric);
        setDirection(bestResult.direction);
        setThresholdValue(bestResult.threshold);
        setStrategy(THRESHOLD_STRATEGIES[1].strategy);
      }
    } else if (strategy !== THRESHOLD_STRATEGIES[0].strategy) {
      const modeKey = isModelA ? "A" : "B";
      let index = 1;
      if (strategy === THRESHOLD_STRATEGIES[1].strategy) {
        index = 1;
      } else if (strategy === THRESHOLD_STRATEGIES[2].strategy) {
        index = 2;
      } else if (strategy === THRESHOLD_STRATEGIES[3].strategy) {
        index = 3;
      }
      const newThreshold = strategyThresholds[modeKey][index];
      if (newThreshold !== thresholdValue) {
        console.log("hello");
        setThresholdValue(newThreshold);
      }
    }
  }, [
    direction,
    isModelA,
    metric,
    modelAExperiment,
    modelBExperiment,
    setDirection,
    setMetric,
    setStrategy,
    strategy,
    strategyThresholds,
    thresholdValue,
    worstCaseModel,
  ]);

  return (
    <div className="w-[635px] h-full relative flex flex-col" ref={containerRef}>
      {data && dataMetric === metric && (
        <>
          <AttackPlot
            mode={mode}
            thresholdValue={thresholdValue}
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
