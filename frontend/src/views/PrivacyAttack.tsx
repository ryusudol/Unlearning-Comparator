import { useState } from "react";

import View from "../components/View";
import AttackConfiguration from "../components/PrivacyAttack/AttackConfiguration";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Separator } from "../components/UI/separator";
import {
  ATTACK_METHODS,
  THRESHOLD_STRATEGIES,
} from "../constants/privacyAttack";

export default function PrivacyAttack({ height }: { height: number }) {
  const [attackMethod, setAttackMethod] = useState(ATTACK_METHODS[0]);
  const [thresholdStrategy, setThresholdStrategy] = useState(
    THRESHOLD_STRATEGIES[0].strategy
  );

  const handleAttackMethodChange = (method: string) => {
    setAttackMethod(method);
  };

  const handleThresholdMethodClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const method = e.currentTarget.id;
    setThresholdStrategy(method);
  };

  return (
    <View
      height={height}
      className="w-full flex justify-evenly items-start rounded-[6px] px-1.5"
    >
      <AttackConfiguration
        onAttackChange={handleAttackMethodChange}
        thresholdStrategy={thresholdStrategy}
        onThresholdChange={handleThresholdMethodClick}
      />
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <AttackAnalytics mode="Baseline" />
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <AttackAnalytics mode="Comparison" />
    </View>
  );
}
