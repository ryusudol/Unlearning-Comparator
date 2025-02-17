import { useState, useEffect, useContext } from "react";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import { useForgetClass } from "../../hooks/useForgetClass";
import {
  ENTROPY,
  CONFIDENCE,
  UNLEARN,
  Metric,
} from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { ExperimentsContext } from "../../store/experiments-context";
import { AttackResult, AttackResults } from "../../types/data";
import { fetchFileData } from "../../utils/api/unlearning";

export type Bin = { img: number; value: number };
export type Data = {
  retrainData: Bin[];
  unlearnData: Bin[];
  lineChartData: AttackResult[];
} | null;

interface Props {
  mode: "Baseline" | "Comparison";
  metric: Metric;
  aboveThreshold: string;
  thresholdStrategy: string;
  strategyCount: number;
  userModified: boolean;
  setUserModified: (val: boolean) => void;
}

export default function AttackAnalytics({
  mode,
  metric,
  aboveThreshold,
  thresholdStrategy,
  strategyCount,
  userModified,
  setUserModified,
}: Props) {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const { forgetClassNumber } = useForgetClass();

  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [attackScore, setAttackScore] = useState(0);
  const [data, setData] = useState<Data>(null);

  const isBaseline = mode === "Baseline";
  const isMetricEntropy = metric === ENTROPY;
  const isAboveThresholdUnlearn = aboveThreshold === UNLEARN;

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
          img: item.img,
          value: isMetricEntropy ? item.entropy : item.confidence,
        });
      });
      experimentAttackValues.forEach((item) => {
        experimentValues.push({
          img: item.img,
          value: isMetricEntropy ? item.entropy : item.confidence,
        });
      });

      const normalizedAboveThreshold = aboveThreshold
        .toLowerCase()
        .replace(/\s+/g, "_");
      const key =
        `${metric.toLowerCase()}_above_${normalizedAboveThreshold}` as keyof AttackResults;
      const lineChartData = experiment.attack.results[key];

      if (!lineChartData) return;

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

  // TODO:
  // useEffect(() => {
  //   if (metric === CONFIDENCE) {
  //     setThresholdValue(3.75);
  //   } else {
  //     setThresholdValue(1.25);
  //   }
  // }, [metric]);

  useEffect(() => {
    setUserModified(false);
  }, [thresholdStrategy, strategyCount, setUserModified]);

  useEffect(() => {
    if (!data || userModified) return;

    if (thresholdStrategy === THRESHOLD_STRATEGIES[0].strategy) {
      // MAX ATTACK SCORE
      const maxAttackData = data.lineChartData.reduce((prev, curr) => {
        return curr.attack_score > prev.attack_score ? curr : prev;
      }, data.lineChartData[0]);
      if (maxAttackData && maxAttackData.threshold !== thresholdValue) {
        setThresholdValue(maxAttackData.threshold);
      }
    } else if (thresholdStrategy === THRESHOLD_STRATEGIES[1].strategy) {
      // MAX SUCCESS RATE
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
      // COMMON THRESHOLD
      const thresholdGroups: { [key: number]: number } = {};
      data.lineChartData.forEach((item) => {
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
  }, [
    data,
    isAboveThresholdUnlearn,
    isMetricEntropy,
    thresholdStrategy,
    thresholdValue,
    userModified,
  ]);

  const handleThresholdValueChange = (newThreshold: number) => {
    setThresholdValue(newThreshold);
    setUserModified(true);
  };

  return (
    <div className="h-full flex flex-col">
      {data && (
        <AttackPlot
          mode={mode}
          metric={metric}
          thresholdValue={thresholdValue}
          aboveThreshold={aboveThreshold}
          thresholdStrategy={thresholdStrategy}
          userModified={userModified}
          data={data}
          setThresholdValue={handleThresholdValueChange}
          onUpdateAttackScore={setAttackScore}
        />
      )}
      {data && (
        <AttackSuccessFailure
          mode={mode}
          metric={metric}
          thresholdValue={thresholdValue}
          aboveThreshold={aboveThreshold}
          thresholdStrategy={thresholdStrategy}
          data={data}
          attackScore={attackScore}
        />
      )}
    </div>
  );
}
