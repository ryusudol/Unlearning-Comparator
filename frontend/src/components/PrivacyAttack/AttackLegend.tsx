import React from "react";

import Button from "../CustomButton";
import {
  ENTROPY,
  CONFIDENCE,
  UNLEARN,
  RETRAIN,
  Metric,
} from "../../views/PrivacyAttack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Separator } from "../UI/separator";
import { Label } from "..//UI/label";

interface AttackLegendProps {
  metric: Metric;
  aboveThreshold: string;
  onMetricChange: (val: Metric) => void;
  onAboveThresholdChange: (val: string) => void;
  onThresholdStrategyChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
    <div className="w-full flex px-3.5 pt-2.5 pb-3.5 text-sm z-10 relative top-1">
      <Button className="w-[175px] h-[70px] bg-[#cc0000] hover:bg-red-600 text-xl font-medium leading-5 rounded-md mr-[27px]">
        SET WORST CASE
        <br />
        SCENARIO
      </Button>
      <div className="flex flex-col mr-[25px]">
        <p className="text-lg font-medium">Metric</p>
        <RadioGroup
          className="flex flex-col gap-1"
          defaultValue={ENTROPY}
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
      <div className="flex flex-col mr-[40px]">
        <p className="text-lg font-medium">Threshold Direction</p>
        <RadioGroup
          className="flex flex-col gap-1 text-nowrap"
          defaultValue={UNLEARN}
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
              {"Above -> Suggested Model"}
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
              {"Above -> Retrained Model"}
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex">
        <div className="mr-2.5">
          <p className="text-lg font-medium">Strategy</p>
          <p className="w-[120px] text-[13px] font-light">
            Choose how thresholds are determined:
          </p>
        </div>
        <div className="flex gap-[15px]">
          {THRESHOLD_STRATEGIES.map((strategy, idx) => (
            <div key={idx} className="flex flex-col">
              <Button
                onClick={onThresholdStrategyChange}
                style={{ width: strategy.length }}
                className="mb-1"
              >
                {strategy.strategy}
              </Button>
              <p
                className="text-[13px] font-light"
                style={{ width: strategy.length }}
              >
                {strategy.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Separator
        orientation="horizontal"
        className="w-[calc(100%+12.8px)] h-[1px] absolute bottom-0 -right-1.5"
      />
    </div>
  );
}
