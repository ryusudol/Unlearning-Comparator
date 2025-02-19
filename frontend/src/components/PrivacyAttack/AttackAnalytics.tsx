import { useState, useEffect, useContext, useRef, useMemo } from "react";

import Tooltip from "./Tooltip";
import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import { useForgetClass } from "../../hooks/useForgetClass";
import { ENTROPY, UNLEARN, Metric } from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { ExperimentsContext } from "../../store/experiments-context";
import { AttackResult, AttackResults } from "../../types/data";
import { Image } from "../../types/privacy-attack";
import { fetchFileData } from "../../utils/api/unlearning";
import { fetchAllSubsetImages } from "../../utils/api/privacyAttack";

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
  setThresholdStrategy,
  setUserModified,
}: Props) {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const { forgetClassNumber } = useForgetClass();

  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [lastThresholdStrategy, setLastThresholdStrategy] = useState("");
  const [attackScore, setAttackScore] = useState(0);
  const [data, setData] = useState<Data>(null);
  const [images, setImages] = useState<Image[]>();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);

  const prevMetricRef = useRef(metric);

  const isBaseline = mode === "Baseline";
  const isMetricEntropy = metric === ENTROPY;
  const isAboveThresholdUnlearn = aboveThreshold === UNLEARN;

  const containerRef = useRef<HTMLDivElement>(null);

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

  const imageMap = useMemo(() => {
    if (!images) return new Map<number, Image>();
    const map = new Map<number, Image>();
    images.forEach((img) => map.set(img.index, img));
    return map;
  }, [images]);

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

  const handleThresholdLineDrag = (newThreshold: number) => {
    setThresholdValue(newThreshold);
    setUserModified(true);
  };

  const handleElementClick = (
    event: React.MouseEvent,
    elementData: Bin & { type: CategoryType }
  ) => {
    event.stopPropagation();
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - containerRect.left;
    const relativeY = event.clientY - containerRect.top;
    const offset = 10;

    setTooltipData(elementData);
    setTooltipPos({ x: relativeX + offset, y: relativeY + offset });
  };

  const closeTooltip = () => {
    setTooltipData(null);
    setTooltipPos(null);
  };

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
      {tooltipData && tooltipPos && (
        <Tooltip
          tooltipData={tooltipData}
          thresholdValue={thresholdValue}
          isAboveThresholdUnlearn={aboveThreshold === UNLEARN}
          metric={metric}
          position={tooltipPos}
          imageData={imageMap.get(tooltipData.img_idx)}
          retrainData={data ? data.retrainData : []}
          unlearnData={data ? data.unlearnData : []}
          onClose={closeTooltip}
        />
      )}
    </div>
  );
}
