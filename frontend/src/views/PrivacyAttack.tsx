import React, { useState, useEffect } from "react";

import Indicator from "../components/Indicator";
import AttackLegend from "../components/PrivacyAttack/AttackLegend";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Prob } from "../types/embeddings";
import { Separator } from "../components/UI/separator";
import { useModelDataStore } from "../stores/modelDataStore";
import { fetchFileData } from "../utils/api/unlearning";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { ExperimentData } from "../types/data";

export const ENTROPY = "entropy";
export const CONFIDENCE = "confidence";
export const UNLEARN = "unlearn";
export const RETRAIN = "retrain";

export type Metric = "entropy" | "confidence";

interface Props {
  baselinePoints: (number | Prob)[][];
  comparisonPoints: (number | Prob)[][];
}

export default function PrivacyAttack({
  baselinePoints,
  comparisonPoints,
}: Props) {
  const { forgetClass } = useForgetClassStore();
  const { modelA, modelB } = useModelDataStore();

  const [metric, setMetric] = useState<Metric>(ENTROPY);
  const [aboveThreshold, setAboveThreshold] = useState(UNLEARN);
  const [thresholdStrategy, setThresholdStrategy] = useState("");
  const [userModified, setUserModified] = useState(false);
  const [strategyCount, setStrategyClick] = useState(0);
  const [retrainData, setRetrainData] = useState<ExperimentData>();

  const isModelAUnlearned =
    !modelA.startsWith("000") && !modelA.startsWith("a00");
  const isModelBUnlearned =
    !modelB.startsWith("000") && !modelB.startsWith("a00");

  useEffect(() => {
    async function loadRetrainData() {
      if (forgetClass === -1) return;
      try {
        const data = await fetchFileData(forgetClass, `a00${forgetClass}`);
        setRetrainData(data);
      } catch (error) {
        console.error(`Failed to fetch an retrained data file: ${error}`);
      }
    }
    loadRetrainData();
  }, [forgetClass]);

  const handleMetricChange = (metric: Metric) => {
    setMetric(metric);
  };

  const handleAboveThresholdChange = (threshold: string) => {
    setAboveThreshold(threshold);
    setStrategyClick((prev) => prev + 1);
  };

  const handleThresholdStrategyChange = (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    const strategy = e.currentTarget.innerHTML;
    setThresholdStrategy(strategy);
  };

  return (
    <div className="h-[665px] flex items-center border rounded-md px-1.5 rounded-tr-none relative">
      <AttackLegend
        onMetricChange={handleMetricChange}
        onAboveThresholdChange={handleAboveThresholdChange}
        onThresholdStrategyChange={handleThresholdStrategyChange}
      />
      {!retrainData ? (
        <Indicator text="Failed to fetch retrain data" />
      ) : isModelAUnlearned ? (
        <AttackAnalytics
          mode="Baseline"
          metric={metric}
          aboveThreshold={aboveThreshold}
          thresholdStrategy={thresholdStrategy}
          strategyCount={strategyCount}
          userModified={userModified}
          retrainPoints={retrainData.points}
          unlearnPoints={baselinePoints}
          retrainAttackData={retrainData.attack}
          setThresholdStrategy={setThresholdStrategy}
          setUserModified={setUserModified}
        />
      ) : (
        <Indicator text="Please select an unlearned model to compare the attack results" />
      )}
      <Separator
        orientation="vertical"
        className="h-[612px] w-[1px] ml-3.5 mr-2"
      />
      {!retrainData ? (
        <Indicator text="Failed to fetch retrain data" />
      ) : isModelBUnlearned ? (
        <AttackAnalytics
          mode="Comparison"
          metric={metric}
          aboveThreshold={aboveThreshold}
          thresholdStrategy={thresholdStrategy}
          strategyCount={strategyCount}
          userModified={userModified}
          retrainPoints={retrainData.points}
          unlearnPoints={comparisonPoints}
          retrainAttackData={retrainData.attack}
          setThresholdStrategy={setThresholdStrategy}
          setUserModified={setUserModified}
        />
      ) : (
        <Indicator text="Please select an unlearned model to compare the attack results" />
      )}
    </div>
  );
}
