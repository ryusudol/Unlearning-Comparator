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
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [metric, setMetric] = useState<Metric>(ENTROPY);
  const [direction, setDirection] = useState(UNLEARN);
  const [strategy, setStrategy] = useState("");
  const [userModified, setUserModified] = useState(false);
  const [strategyCount, setStrategyClick] = useState(0);
  const [retrainData, setRetrainData] = useState<ExperimentData>();

  const isModelAOriginal = modelA.startsWith("000");
  const isModelBOriginal = modelB.startsWith("000");

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
    setDirection(threshold);
    setStrategyClick((prev) => prev + 1);
  };

  const handleThresholdStrategyChange = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const strategy = e.currentTarget.innerHTML;
    setStrategy(strategy);
  };

  return (
    <div className="h-[764px] flex flex-col border rounded-md px-1.5">
      <AttackLegend
        metric={metric}
        direction={direction}
        onMetricChange={handleMetricChange}
        onAboveThresholdChange={handleAboveThresholdChange}
        onThresholdStrategyChange={handleThresholdStrategyChange}
      />
      <div className="flex items-center">
        {!retrainData ? (
          <Indicator text="Failed to fetch retrain data" />
        ) : isModelAOriginal ? (
          <Indicator text="Please select an unlearned model to compare the attack results" />
        ) : (
          <AttackAnalytics
            mode="Baseline"
            metric={metric}
            direction={direction}
            strategy={strategy}
            strategyCount={strategyCount}
            userModified={userModified}
            retrainPoints={retrainData.points}
            unlearnPoints={baselinePoints}
            retrainAttackData={retrainData.attack}
            setStrategy={setStrategy}
            setUserModified={setUserModified}
            onUpdateMetric={handleMetricChange}
            onUpdateDirection={handleAboveThresholdChange}
          />
        )}
        <Separator
          orientation="vertical"
          className="h-[635px] w-[1px] mx-1 relative top-3"
        />
        {!retrainData ? (
          <Indicator text="Failed to fetch retrain data" />
        ) : isModelBOriginal ? (
          <Indicator text="Please select an unlearned model to compare the attack results" />
        ) : (
          <AttackAnalytics
            mode="Comparison"
            metric={metric}
            direction={direction}
            strategy={strategy}
            strategyCount={strategyCount}
            userModified={userModified}
            retrainPoints={retrainData.points}
            unlearnPoints={comparisonPoints}
            retrainAttackData={retrainData.attack}
            setStrategy={setStrategy}
            setUserModified={setUserModified}
            onUpdateMetric={handleMetricChange}
            onUpdateDirection={handleAboveThresholdChange}
          />
        )}
      </div>
    </div>
  );
}
