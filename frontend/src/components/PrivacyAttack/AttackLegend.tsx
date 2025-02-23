import React from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../UI/hover-card";
import {
  ENTROPY,
  CONFIDENCE,
  UNLEARN,
  RETRAIN,
  Metric,
} from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Label } from "..//UI/label";
import { Separator } from "../UI/separator";

interface AttackLegendProps {
  metric: Metric;
  aboveThreshold: string;
  onMetricChange: (val: Metric) => void;
  onAboveThresholdChange: (val: string) => void;
  onThresholdStrategyChange: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function AttackLegend({
  metric,
  aboveThreshold,
  onMetricChange,
  onAboveThresholdChange,
  onThresholdStrategyChange,
}: AttackLegendProps) {
  const isEntropyChecked = metric === ENTROPY;
  const isUnlearnChecked = aboveThreshold === UNLEARN;

  return (
    <div className="flex items-center gap-[22px] bg-white border border-b-white rounded-t-[6px] px-2 py-1 absolute -top-[29px] -right-[1px] text-sm z-10">
      <div className="flex items-center relative bottom-[1px]">
        <span className="font-medium mr-2">Metric</span>
        <RadioGroup
          className="flex"
          defaultValue={ENTROPY}
          onValueChange={onMetricChange}
        >
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem
              value={ENTROPY}
              id={ENTROPY}
              color="#4d4d4d"
              checked={isEntropyChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={ENTROPY}>
              Entropy
            </Label>
          </div>
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem
              value={CONFIDENCE}
              id={CONFIDENCE}
              color="#4d4d4d"
              checked={!isEntropyChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={CONFIDENCE}>
              Confidence
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center relative bottom-[1px]">
        <span className="font-medium mr-2">Above Threshold</span>
        <RadioGroup
          className="flex"
          defaultValue={UNLEARN}
          onValueChange={onAboveThresholdChange}
        >
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem
              value={UNLEARN}
              id={UNLEARN}
              color="#4d4d4d"
              checked={isUnlearnChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={UNLEARN}>
              Unlearn
            </Label>
          </div>
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem
              value={RETRAIN}
              id={RETRAIN}
              color="#4d4d4d"
              checked={!isUnlearnChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={RETRAIN}>
              Retrain
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center relative bottom-[1px]">
        <span className="font-medium mr-2">Threshold Strategy</span>
        <div className="flex items-center gap-1.5">
          {THRESHOLD_STRATEGIES.map((strategy, idx) => (
            <HoverCard key={idx} openDelay={0} closeDelay={100}>
              <HoverCardTrigger
                onClick={onThresholdStrategyChange}
                className="h-5 flex items-center bg-[#585858] text-white text-xs font-medium px-2 rounded-md cursor-pointer hover:bg-[#696969] transition"
              >
                {strategy.strategy}
              </HoverCardTrigger>
              <HoverCardContent className="w-auto px-3 py-2" side="top">
                {strategy.explanation}
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
      <Separator
        orientation="horizontal"
        className="absolute bottom-[1px] h-[1px] w-[calc(100%-16px)]"
      />
    </div>
  );
}
