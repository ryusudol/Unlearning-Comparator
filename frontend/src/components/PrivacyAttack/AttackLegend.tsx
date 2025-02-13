import React from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../UI/hover-card";
import {
  ENTROPY,
  CONFIDENCE,
  MEMBERS_ABOVE,
  MEMBERS_BELOW,
  ThresholdSetting,
} from "../../views/PrivacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Label } from "..//UI/label";
import { Separator } from "../UI/separator";

interface AttackLegendProps {
  onMetricChange: (val: string) => void;
  onThresholdSettingChange: (val: ThresholdSetting) => void;
  onThresholdStrategyChange: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function AttackLegend({
  onMetricChange,
  onThresholdSettingChange,
  onThresholdStrategyChange,
}: AttackLegendProps) {
  return (
    <div className="flex items-center border border-b-white rounded-t-[6px] px-2 py-1 absolute -top-[29px] -right-[1px] text-sm z-10">
      <div className="flex items-center mr-6 relative bottom-[1px]">
        <span className="font-medium mr-3">Metric</span>
        <RadioGroup
          className="flex"
          defaultValue={ENTROPY}
          onValueChange={onMetricChange}
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value={ENTROPY} id={ENTROPY} />
            <Label className="text-sm" htmlFor={ENTROPY}>
              Train
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value={CONFIDENCE} id={CONFIDENCE} />
            <Label className="text-sm" htmlFor={CONFIDENCE}>
              Test
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center relative bottom-[1px]">
        <span className="font-medium mr-3">Threshold Settings</span>
        <RadioGroup
          className="flex"
          defaultValue={MEMBERS_ABOVE}
          onValueChange={onThresholdSettingChange}
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value={MEMBERS_ABOVE} id={MEMBERS_ABOVE} />
            <Label className="text-sm" htmlFor={MEMBERS_ABOVE}>
              {MEMBERS_ABOVE}
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value={MEMBERS_BELOW} id={MEMBERS_BELOW} />
            <Label className="text-sm" htmlFor={MEMBERS_BELOW}>
              {MEMBERS_BELOW}
            </Label>
          </div>
        </RadioGroup>
        <Separator
          orientation="vertical"
          className="w-[1.5px] h-3.5 mx-3 bg-black"
        />
        <div className="flex items-center gap-3">
          <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger
              onClick={onThresholdStrategyChange}
              className="h-5 flex items-center bg-[#585858] text-white text-xs font-medium px-3 rounded-md cursor-pointer hover:bg-[#696969] transition"
            >
              MAX ATTACK SCORE
            </HoverCardTrigger>
            <HoverCardContent className="w-auto px-3 py-2" side="bottom">
              A single threshold is applied to compare models fairly under the
              <br />
              same decision boundary. By optimizing their combined measure,
              <br />
              we see how each model's forgetting potential fares without
              <br />
              giving either one a customized advantage.
            </HoverCardContent>
          </HoverCard>

          <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger
              onClick={onThresholdStrategyChange}
              className="h-5 flex items-center bg-[#585858] text-white text-xs font-medium px-3 rounded-md cursor-pointer hover:bg-[#696969] transition"
            >
              MAX SUCCESS RATE
            </HoverCardTrigger>
            <HoverCardContent className="w-auto px-3 py-2" side="bottom">
              This approach centers on maximizing correct classification of
              <br />
              whether a sample came from the retrain or the unlearned model,
              <br />
              highlighting how easily an attacker can identify membership.
              <br />
              It underscores the model’s immediate privacy risk.
            </HoverCardContent>
          </HoverCard>

          <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger
              onClick={onThresholdStrategyChange}
              className="h-5 flex items-center bg-[#585858] text-white text-xs font-medium px-3 rounded-md cursor-pointer hover:bg-[#696969] transition"
            >
              COMMON THRESHOLD
            </HoverCardTrigger>
            <HoverCardContent className="w-auto px-3 py-2" side="bottom">
              A single threshold is applied to compare models fairly under the
              <br />
              same decision boundary. By optimizing their combined measure,
              <br />
              we see how each model’s forgetting potential fares without giving
              <br />
              either one a customized advantage.
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <Separator
        orientation="horizontal"
        className="absolute bottom-[1px] h-[1px] w-[calc(100%-16px)]"
      />
    </div>
  );
}
