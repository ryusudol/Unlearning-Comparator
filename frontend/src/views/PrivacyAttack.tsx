import { useState } from "react";

import View from "../components/View";
// import AttackConfiguration from "../components/PrivacyAttack/AttackConfiguration";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Separator } from "../components/UI/separator";
import {
  // ATTACK_METHODS,
  THRESHOLD_STRATEGIES,
} from "../constants/privacyAttack";

export default function PrivacyAttack({ height }: { height: number }) {
  // const [attackMethod, setAttackMethod] = useState(ATTACK_METHODS[0]);
  const [thresholdStrategy, setThresholdStrategy] = useState(
    THRESHOLD_STRATEGIES[0].strategy
  );
  const [strategyClick, setStrategyClick] = useState(0);

  // const handleAttackMethodChange = (method: string) => {
  //   setAttackMethod(method);
  // };

  // const handleThresholdMethodClick = (e: React.MouseEvent<HTMLDivElement>) => {
  //   const method = e.currentTarget.id;
  //   setThresholdStrategy(method);
  //   setStrategyClick((prev) => prev + 1);
  // };

  return (
    <View
      height={height}
      className="w-full flex items-center rounded-[6px] px-1.5"
    >
      <AttackAnalytics
        mode="Baseline"
        thresholdStrategy={thresholdStrategy}
        strategyClick={strategyClick}
      />
      <Separator
        orientation="vertical"
        className="h-[612px] w-[1px] ml-3.5 mr-2"
      />
      <AttackAnalytics
        mode="Comparison"
        thresholdStrategy={thresholdStrategy}
        strategyClick={strategyClick}
      />
    </View>
  );
}
