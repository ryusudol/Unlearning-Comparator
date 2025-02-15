import React, { useState } from "react";

import View from "../components/View";
import AttackLegend from "../components/PrivacyAttack/AttackLegend";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { THRESHOLD_STRATEGIES } from "../constants/privacyAttack";
import { Separator } from "../components/UI/separator";

export const ENTROPY = "entropy";
export const CONFIDENCE = "confidence";
export const ABOVE_UNLEARN = "Above Unlearn";
export const ABOVE_RETRAIN = "Above Retrain";

export type Metric = "entropy" | "confidence";

export default function PrivacyAttack({ height }: { height: number }) {
  const [metric, setMetric] = useState<Metric>(ENTROPY);
  const [aboveThreshold, setAboveThreshold] = useState(ABOVE_UNLEARN);
  const [thresholdStrategy, setThresholdStrategy] = useState(
    THRESHOLD_STRATEGIES[0].strategy
  );
  const [strategyCount, setStrategyClick] = useState(0);

  const handleMetricChange = (metric: Metric) => {
    setMetric(metric);
  };

  const handleThresholdSettingChange = (threshold: string) => {
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
        onThresholdSettingChange={handleThresholdSettingChange}
        onThresholdStrategyChange={handleThresholdStrategyChange}
      />
      <AttackAnalytics
        mode="Baseline"
        metric={metric}
        thresholdSetting={aboveThreshold}
        thresholdStrategy={thresholdStrategy}
        strategyCount={strategyCount}
      />
      <Separator
        orientation="vertical"
        className="h-[612px] w-[1px] ml-3.5 mr-2"
      />
      <AttackAnalytics
        mode="Comparison"
        metric={metric}
        thresholdSetting={aboveThreshold}
        thresholdStrategy={thresholdStrategy}
        strategyCount={strategyCount}
      />
    </View>
  );
}
