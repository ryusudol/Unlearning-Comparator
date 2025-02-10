import { useState, useEffect } from "react";
import * as d3 from "d3";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import { AttackData } from "../../types/privacy-attack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";

interface Props {
  mode: "Baseline" | "Comparison";
  thresholdStrategy: string;
  strategyClick: number;
}

export default function AttackAnalytics({
  mode,
  thresholdStrategy,
  strategyClick,
}: Props) {
  const [threshold, setThreshold] = useState<number>(1.25);
  const [attackScore, setAttackScore] = useState<number>(0);
  const [userModified, setUserModified] = useState<boolean>(false);

  const [data, setData] = useState<{
    retrainJson: any;
    ga3Json: any;
    attackData: AttackData[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      d3.json<any>("class_1_Retrain.json"),
      d3.json<any>("Class_1_GA3.json"),
      d3.json<AttackData[]>("Entropy_Scores_from_Attack_Exp.json"),
    ]).then(([retrainJson, ga3Json, attackData]) => {
      if (!retrainJson || !ga3Json || !attackData) return;
      setData({ retrainJson, ga3Json, attackData });
    });
  }, []);

  useEffect(() => {
    setUserModified(false);
  }, [thresholdStrategy, strategyClick]);

  useEffect(() => {
    if (data && !userModified) {
      if (thresholdStrategy === THRESHOLD_STRATEGIES[0].strategy) {
        const maxAttackData = data.attackData.reduce((prev, curr) => {
          return curr.attack_score > prev.attack_score ? curr : prev;
        }, data.attackData[0]);
        if (maxAttackData && maxAttackData.threshold !== threshold) {
          setThreshold(maxAttackData.threshold);
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
          { th: threshold, sum: -Infinity }
        );
        if (bestThresholdEntry.th !== threshold) {
          setThreshold(bestThresholdEntry.th);
        }
      }
    }
  }, [data, thresholdStrategy, userModified, threshold]);

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    setUserModified(true);
  };

  return (
    <div className="h-full flex flex-col">
      {data && (
        <AttackPlot
          mode={mode}
          threshold={threshold}
          setThreshold={handleThresholdChange}
          retrainJson={data.retrainJson}
          ga3Json={data.ga3Json}
          attackData={data.attackData}
          onUpdateAttackScore={setAttackScore}
        />
      )}
      {data && (
        <AttackSuccessFailure
          mode={mode}
          threshold={threshold}
          retrainJson={data.retrainJson}
          ga3Json={data.ga3Json}
          attackScore={attackScore}
        />
      )}
    </div>
  );
}
