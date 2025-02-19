import React, { useState, useContext, useEffect, useMemo } from "react";

import View from "../components/View";
import Indicator from "../components/Indicator";
import AttackLegend from "../components/PrivacyAttack/AttackLegend";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Prob } from "../types/embeddings";
import { processPointsData } from "../utils/data/experiments";
import { Separator } from "../components/UI/separator";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { fetchFileData } from "../utils/api/unlearning";
import { useForgetClass } from "../hooks/useForgetClass";
import { Point } from "../types/data";

export const ENTROPY = "entropy";
export const CONFIDENCE = "confidence";
export const UNLEARN = "unlearn";
export const RETRAIN = "retrain";

export type Metric = "entropy" | "confidence";

interface Props {
  height: number;
  baselinePoints: (number | Prob)[][];
  comparisonPoints: (number | Prob)[][];
}

export default function PrivacyAttack({
  height,
  baselinePoints,
  comparisonPoints,
}: Props) {
  const { forgetClassNumber } = useForgetClass();

  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const [metric, setMetric] = useState<Metric>(ENTROPY);
  const [aboveThreshold, setAboveThreshold] = useState(UNLEARN);
  const [thresholdStrategy, setThresholdStrategy] = useState("");
  const [userModified, setUserModified] = useState(false);
  const [strategyCount, setStrategyClick] = useState(0);
  const [retrainPoints, setRetrainPoints] = useState<Point[]>([]);

  const isBaselinePretrained = baseline.startsWith("000");
  const isComparisonPretrained = comparison.startsWith("000");

  useEffect(() => {
    async function loadRetrainData() {
      try {
        const data = await fetchFileData(
          forgetClassNumber,
          `a00${forgetClassNumber}`
        );
        setRetrainPoints(data.points);
      } catch (error) {
        console.error(`Failed to fetch an retrained data file: ${error}`);
        setRetrainPoints([]);
      }
    }
    loadRetrainData();
  }, [forgetClassNumber]);

  const processedRetrainPoints = useMemo(
    () => processPointsData(retrainPoints),
    [retrainPoints]
  );

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
    <View
      height={height}
      className="w-full flex items-center rounded-[6px] px-1.5 rounded-tr-none relative"
    >
      <AttackLegend
        onMetricChange={handleMetricChange}
        onAboveThresholdChange={handleAboveThresholdChange}
        onThresholdStrategyChange={handleThresholdStrategyChange}
      />
      {isBaselinePretrained ? (
        <Indicator text="Please select unlearned models to compare attack results" />
      ) : (
        <AttackAnalytics
          mode="Baseline"
          metric={metric}
          aboveThreshold={aboveThreshold}
          thresholdStrategy={thresholdStrategy}
          strategyCount={strategyCount}
          userModified={userModified}
          retrainPoints={processedRetrainPoints}
          unlearnPoints={baselinePoints}
          setThresholdStrategy={setThresholdStrategy}
          setUserModified={setUserModified}
        />
      )}
      <Separator
        orientation="vertical"
        className="h-[612px] w-[1px] ml-3.5 mr-2"
      />
      {isComparisonPretrained ? (
        <Indicator text="Please select unlearned models to compare attack results" />
      ) : (
        <AttackAnalytics
          mode="Comparison"
          metric={metric}
          aboveThreshold={aboveThreshold}
          thresholdStrategy={thresholdStrategy}
          strategyCount={strategyCount}
          userModified={userModified}
          retrainPoints={processedRetrainPoints}
          unlearnPoints={comparisonPoints}
          setThresholdStrategy={setThresholdStrategy}
          setUserModified={setUserModified}
        />
      )}
    </View>
  );
}
