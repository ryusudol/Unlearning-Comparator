import React from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../UI/hover-card";
import {
  ENTROPY,
  CONFIDENCE,
  ABOVE_UNLEARN,
  ABOVE_RETRAIN,
  Metric,
} from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Label } from "..//UI/label";
import { Separator } from "../UI/separator";

interface AttackLegendProps {
  onMetricChange: (val: Metric) => void;
  onThresholdSettingChange: (val: string) => void;
  onThresholdStrategyChange: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function AttackLegend({
  onMetricChange,
  onThresholdSettingChange,
  onThresholdStrategyChange,
}: AttackLegendProps) {
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
            <RadioGroupItem value={ENTROPY} id={ENTROPY} />
            <Label className="text-sm" htmlFor={ENTROPY}>
              Entropy
            </Label>
          </div>
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem value={CONFIDENCE} id={CONFIDENCE} />
            <Label className="text-sm" htmlFor={CONFIDENCE}>
              Confidence
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center relative bottom-[1px]">
        <span className="font-medium mr-2">Above Threshold</span>
        <RadioGroup
          className="flex"
          defaultValue={ABOVE_UNLEARN}
          onValueChange={onThresholdSettingChange}
        >
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem value={ABOVE_UNLEARN} id={ABOVE_UNLEARN} />
            <Label className="text-sm" htmlFor={ABOVE_UNLEARN}>
              Unlearn
            </Label>
          </div>
          <div className="flex items-center space-x-0.5">
            <RadioGroupItem value={ABOVE_RETRAIN} id={ABOVE_RETRAIN} />
            <Label className="text-sm" htmlFor={ABOVE_RETRAIN}>
              Retrain
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center relative bottom-[1px]">
        <span className="font-medium mr-2">Threshold Strategy</span>
        <div className="flex items-center gap-1.5">
          {THRESHOLD_STRATEGIES.map((strategy) => (
            <HoverCard openDelay={0} closeDelay={100}>
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
