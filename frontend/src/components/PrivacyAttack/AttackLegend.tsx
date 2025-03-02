import React from "react";

import Button from "../CustomButton";
import {
  ENTROPY,
  CONFIDENCE,
  UNLEARN,
  RETRAIN,
  Metric,
} from "../../views/PrivacyAttack";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../UI/hover-card";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Separator } from "../UI/separator";
import { Label } from "..//UI/label";
import { COLORS } from "../../constants/colors";

interface AttackLegendProps {
  metric: Metric;
  direction: string;
  strategy: string;
  onMetricChange: (val: Metric) => void;
  onAboveThresholdChange: (val: string) => void;
  onThresholdStrategyChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function AttackLegend({
  metric,
  direction,
  strategy,
  onMetricChange,
  onAboveThresholdChange,
  onThresholdStrategyChange,
}: AttackLegendProps) {
  const isEntropyChecked = metric === ENTROPY;
  const isUnlearnChecked = direction === UNLEARN;

  return (
    <div className="w-full flex px-3.5 pt-2.5 pb-3.5 text-sm z-10 relative top-1">
      <div className="flex items-center gap-2.5 mr-[21px]">
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <Button
              style={{ backgroundColor: COLORS.EMERALD }}
              className="w-[115px] h-[70px] text-xl font-medium leading-5 rounded-md"
              onClick={() =>
                onThresholdStrategyChange({
                  currentTarget: { innerHTML: "BEST_ATTACK_A" },
                } as React.MouseEvent<HTMLButtonElement>)
              }
            >
              Model A
              <br />
              Best Attack
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto px-3 py-2" side="top">
            Automatically picks Metric, Threshold Direction, and Strategy
            yielding the lowest forgetting quality score.
          </HoverCardContent>
        </HoverCard>
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <Button
              style={{ backgroundColor: COLORS.PURPLE }}
              className="w-[115px] h-[70px] text-xl font-medium leading-5 rounded-md"
              onClick={() =>
                onThresholdStrategyChange({
                  currentTarget: { innerHTML: "BEST_ATTACK_B" },
                } as React.MouseEvent<HTMLButtonElement>)
              }
            >
              Model B
              <br />
              Best Attack
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto px-3 py-2" side="top">
            Automatically picks Metric, Threshold Direction, and Strategy
            yielding the lowest forgetting quality score.
          </HoverCardContent>
        </HoverCard>
      </div>

      <div className="flex flex-col mr-[21px]">
        <p className="text-lg font-medium">Metric</p>
        <RadioGroup
          className="flex flex-col gap-1"
          value={metric}
          onValueChange={onMetricChange}
        >
          <div className="flex items-center space-x-[5px]">
            <RadioGroupItem
              className="w-3 h-3"
              value={ENTROPY}
              id={ENTROPY}
              color="#4d4d4d"
              checked={isEntropyChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={ENTROPY}>
              Entropy
            </Label>
          </div>
          <div className="flex items-center space-x-[5px]">
            <RadioGroupItem
              className="w-3 h-3"
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

      <div className="flex flex-col mr-[30px]">
        <p className="text-lg font-medium text-nowrap">Direction</p>
        <RadioGroup
          className="flex flex-col gap-1 text-nowrap"
          value={direction}
          onValueChange={onAboveThresholdChange}
        >
          <div className="flex items-center space-x-[5px]">
            <RadioGroupItem
              className="w-3 h-3"
              value={UNLEARN}
              id={UNLEARN}
              color="#4d4d4d"
              checked={isUnlearnChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={UNLEARN}>
              {"Above -> Model A/B"}
            </Label>
          </div>
          <div className="flex items-center space-x-[5px]">
            <RadioGroupItem
              className="w-3 h-3"
              value={RETRAIN}
              id={RETRAIN}
              color="#4d4d4d"
              checked={!isUnlearnChecked}
            />
            <Label className="text-sm text-[#4d4d4d]" htmlFor={RETRAIN}>
              {"Above -> Retrained"}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex">
        <div className="mr-2">
          <p className="text-lg font-medium">Strategy</p>
          <p className="w-[120px] text-[13px] font-light">
            Choose how thresholds are determined:
          </p>
        </div>
        <div className="flex gap-[15px]">
          {THRESHOLD_STRATEGIES.map((s, idx) => (
            <div key={idx} className="flex flex-col">
              <Button
                onClick={onThresholdStrategyChange}
                style={{ width: s.length }}
                className={`mb-1 ${
                  strategy === s.strategy &&
                  "bg-gray-100 hover:bg-gray-100 text-red-500 cursor-default"
                }`}
              >
                {s.strategy}
              </Button>
              <p className="text-[13px] font-light" style={{ width: s.length }}>
                {s.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Separator
        orientation="horizontal"
        className="w-[calc(100%+12.8px)] h-[1px] absolute -bottom-0.5 -right-1.5"
      />
    </div>
  );
}
