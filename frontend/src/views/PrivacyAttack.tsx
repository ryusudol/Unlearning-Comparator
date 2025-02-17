import React, { useState, useEffect } from "react";

import View from "../components/View";
import AttackLegend from "../components/PrivacyAttack/AttackLegend";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Separator } from "../components/UI/separator";

export const ENTROPY = "entropy";
export const CONFIDENCE = "confidence";
export const UNLEARN = "Unlearn";
export const RETRAIN = "Retrain";

export type Metric = "entropy" | "confidence";

export default function PrivacyAttack({ height }: { height: number }) {
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
        userModifiedArr={[baselineUserModified, comparisonUserModified]}
        onMetricChange={handleMetricChange}
        onAboveThresholdChange={handleAboveThresholdChange}
        onThresholdStrategyChange={handleThresholdStrategyChange}
      />
      <AttackAnalytics
        mode="Baseline"
        metric={metric}
        aboveThreshold={aboveThreshold}
        thresholdStrategy={thresholdStrategy}
        strategyCount={strategyCount}
        userModified={baselineUserModified}
        setUserModified={setBaselineUserModified}
      />
      <Separator
        orientation="vertical"
        className="h-[612px] w-[1px] ml-3.5 mr-2"
      />
      <AttackAnalytics
        mode="Comparison"
        metric={metric}
        aboveThreshold={aboveThreshold}
        thresholdStrategy={thresholdStrategy}
        strategyCount={strategyCount}
        userModified={comparisonUserModified}
        setUserModified={setComparisonUserModified}
      />
    </View>
  );
}
