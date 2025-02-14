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
  thresholdSetting: string;
  thresholdStrategy: string;
  strategyCount: number;
}

export default function AttackAnalytics({
  mode,
  metric,
  thresholdSetting,
  thresholdStrategy,
  strategyCount,
}: Props) {
  const [thresholdValue, setThresholdValue] = useState(1.25);
  const [attackScore, setAttackScore] = useState(0);
  const [userModified, setUserModified] = useState(false);
  const [data, setData] = useState<Data>(null);

  console.log(thresholdValue);

  useEffect(() => {
    Promise.all([
      d3.json<any>("class_1_Retrain.json"),
      d3.json<any>("Class_1_GA3.json"),
      d3.json<any>("class_1_4scenarios.json"),
    ]).then(([retrainJson, unlearnJson, scenarios]) => {
      if (!retrainJson || !unlearnJson || !scenarios) return;

      const normalizedThresholdSetting = thresholdSetting
        .toLowerCase()
        .replace(/\s+/g, "_");
      const key = `${metric.toLowerCase()}_${normalizedThresholdSetting}`;

      const attackData = scenarios[key];

      if (!attackData) {
        console.error(
          `metric: ${metric} 와 thresholdSetting: ${thresholdSetting} 에 대응하는 attackData가 없습니다.`
        );
        return;
      }

      setData({ retrainJson, unlearnJson, attackData });
    });
  }, [metric, thresholdSetting]);

  useEffect(() => {
    setUserModified(false);
  }, [thresholdStrategy, strategyCount]);

  useEffect(() => {
    if (!data || userModified) return;

    if (thresholdStrategy === THRESHOLD_STRATEGIES[0].strategy) {
      const maxAttackData = data.attackData.reduce((prev, curr) => {
        return curr.attack_score > prev.attack_score ? curr : prev;
      }, data.attackData[0]);
      if (maxAttackData && maxAttackData.threshold !== thresholdValue) {
        setThresholdValue(maxAttackData.threshold);
      }
    } else if (thresholdStrategy === THRESHOLD_STRATEGIES[1].strategy) {
      const retrainValues: number[] = data.retrainJson?.entropy?.values || [];
      const ga3Values: number[] = data.unlearnJson?.entropy?.values || [];
      const allValues = [...retrainValues, ...ga3Values];
      if (allValues.length === 0) return;
      const candidateSet = new Set<number>();
      allValues.forEach((v) => {
        const base = Math.floor(v / 0.05) * 0.05;
        candidateSet.add(base);
        candidateSet.add(base + 0.05);
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
  }, [data, thresholdStrategy, userModified, thresholdValue, metric]);

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
          thresholdSetting={thresholdSetting}
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
