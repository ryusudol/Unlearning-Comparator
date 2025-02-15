import { useState, useEffect } from "react";
import * as d3 from "d3";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import { Metric } from "../../views/PrivacyAttack";
import { ExperimentJsonData, AttackData } from "../../types/privacy-attack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";

export type Data = {
  retrainJson: ExperimentJsonData;
  unlearnJson: ExperimentJsonData;
  attackData: AttackData[];
} | null;

interface Props {
  mode: "Baseline" | "Comparison";
  metric: Metric;
  aboveThreshold: string;
  thresholdStrategy: string;
  strategyCount: number;
}

export default function AttackAnalytics({
  mode,
  metric,
  aboveThreshold,
  thresholdStrategy,
  strategyCount,
}: Props) {
  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [attackScore, setAttackScore] = useState(0);
  const [userModified, setUserModified] = useState(false);
  const [data, setData] = useState<Data>(null);

  const isMetricEntropy = metric === "entropy";

  useEffect(() => {
    Promise.all([
      d3.json<any>("class_1_Retrain.json"),
      d3.json<any>(
        isMetricEntropy
          ? "Class_1_GA3.json"
          : "Attack_Exp_Confidence_Scores.json"
      ),
      d3.json<any>("class_1_4scenarios.json"),
    ]).then(([retrainJson, unlearnJson, scenarios]) => {
      if (!retrainJson || !unlearnJson || !scenarios) return;

      const normalizedAboveThreshold = aboveThreshold
        .toLowerCase()
        .replace(/\s+/g, "_");
      const key = `${metric.toLowerCase()}_above_${normalizedAboveThreshold}`;

      const attackData = scenarios[key];

      if (!attackData) {
        return;
      }

      setData({ retrainJson, unlearnJson, attackData });
    });
  }, [isMetricEntropy, metric, aboveThreshold]);

  useEffect(() => {
    setUserModified(false);
  }, [thresholdStrategy, strategyCount]);

  useEffect(() => {
    if (!data || userModified) return;

    if (thresholdStrategy === THRESHOLD_STRATEGIES[0].strategy) {
      // MAX ATTACK SCORE
      const maxAttackData = data.attackData.reduce((prev, curr) => {
        return curr.attack_score > prev.attack_score ? curr : prev;
      }, data.attackData[0]);
      if (maxAttackData && maxAttackData.threshold !== thresholdValue) {
        setThresholdValue(maxAttackData.threshold);
      }
    } else if (thresholdStrategy === THRESHOLD_STRATEGIES[1].strategy) {
      // MAX SUCCESS RATE
      const step = isMetricEntropy ? 0.05 : 0.25;
      const retrainValues: number[] = data.retrainJson?.[metric]?.values || [];
      const ga3Values: number[] = data.unlearnJson?.[metric]?.values || [];
      const allValues = [...retrainValues, ...ga3Values];
      if (allValues.length === 0) return;
      const candidateSet = new Set<number>();
      allValues.forEach((v) => {
        const base = Math.floor(v / step) * step;
        candidateSet.add(base);
        candidateSet.add(base + step);
      });
      const candidates = Array.from(candidateSet).sort((a, b) => a - b);
      let bestCandidate = thresholdValue;
      let bestSuccessCount = -Infinity;
      candidates.forEach((candidate) => {
        const successCount =
          retrainValues.filter((v) => v < candidate).length +
          ga3Values.filter((v) => v > candidate).length;
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
      data.attackData.forEach((item) => {
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
    isMetricEntropy,
    metric,
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
          setThresholdValue={handleThresholdValueChange}
          data={data}
          onUpdateAttackScore={setAttackScore}
        />
      )}
      {data && (
        <AttackSuccessFailure
          mode={mode}
          thresholdValue={thresholdValue}
          retrainJson={data.retrainJson}
          ga3Json={data.unlearnJson}
          attackScore={attackScore}
        />
      )}
    </div>
  );
}
