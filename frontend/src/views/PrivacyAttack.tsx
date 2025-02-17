import React, { useState, useEffect, useContext } from "react";

import View from "../components/View";
import Indicator from "../components/Indicator";
import AttackLegend from "../components/PrivacyAttack/AttackLegend";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Separator } from "../components/UI/separator";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";

export const ENTROPY = "entropy";
export const CONFIDENCE = "confidence";
export const UNLEARN = "Unlearn";
export const RETRAIN = "Retrain";

export type Metric = "entropy" | "confidence";

export default function PrivacyAttack({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const [metric, setMetric] = useState<Metric>(ENTROPY);
  const [aboveThreshold, setAboveThreshold] = useState(UNLEARN);
  const [thresholdStrategy, setThresholdStrategy] = useState("");
  const [baselineUserModified, setBaselineUserModified] = useState(false);
  const [comparisonUserModified, setComparisonUserModified] = useState(false);
  const [strategyCount, setStrategyClick] = useState(0);

  useEffect(() => {
    if (baselineUserModified || comparisonUserModified) {
      setThresholdStrategy("");
    }
  }, [baselineUserModified, comparisonUserModified]);

  const isBaselinePretrained = baseline.startsWith("000");
  const isComparisonPretrained = comparison.startsWith("000");

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
        thresholdStrategy={thresholdStrategy}
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
          setUserModified={setBaselineUserModified}
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
          setUserModified={setComparisonUserModified}
        />
      )}
    </View>
  );
}
