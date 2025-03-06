import React from "react";
import { MoveRight } from "lucide-react";

import Button from "../CustomButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../UI/tabs";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Separator } from "../UI/separator";
import { Label } from "..//UI/label";
import { COLORS } from "../../constants/colors";
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

interface AttackLegendProps {
  metric: Metric;
  direction: string;
  strategy: string;
  onUpdateMetric: (val: Metric) => void;
  onUpdateDirection: (val: string) => void;
  onUpdateStrategy: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function AttackLegend({
  metric,
  direction,
  strategy,
  onUpdateMetric,
  onUpdateDirection,
  onUpdateStrategy,
}: AttackLegendProps) {
  const isEntropyChecked = metric === ENTROPY;
  const isUnlearnChecked = direction === UNLEARN;

  return (
    <div className="w-full flex px-3.5 pt-2 pb-[18px] text-sm z-10 relative top-1">
      <div className="flex items-center gap-2.5 mr-[21px] relative top-0.5">
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <Button
              style={{ backgroundColor: COLORS.EMERALD }}
              className="w-[115px] h-[70px] text-xl font-medium leading-5 rounded-md"
              onClick={() =>
                onUpdateStrategy({
                  currentTarget: { innerHTML: "BEST_ATTACK_A" },
                } as React.MouseEvent<HTMLButtonElement>)
              }
            >
              Model A
              <br />
              Worst Case
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto px-3 py-2" side="top">
            Automatically picks Metric, Threshold
            <br />
            Direction, and Strategy yielding the
            <br />
            lowest forgetting quality score.
          </HoverCardContent>
        </HoverCard>
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <Button
              style={{ backgroundColor: COLORS.PURPLE }}
              className="w-[115px] h-[70px] text-xl font-medium leading-5 rounded-md"
              onClick={() =>
                onUpdateStrategy({
                  currentTarget: { innerHTML: "BEST_ATTACK_B" },
                } as React.MouseEvent<HTMLButtonElement>)
              }
            >
              Model B
              <br />
              Worst Case
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto px-3 py-2" side="top">
            Automatically picks Metric, Threshold
            <br />
            Direction, and Strategy yielding the
            <br />
            lowest forgetting quality score.
          </HoverCardContent>
        </HoverCard>
      </div>

      <div className="flex flex-col mr-[21px]">
        <p className="text-lg font-medium">Metric</p>
        <RadioGroup
          className="flex flex-col gap-1"
          value={metric}
          onValueChange={onUpdateMetric}
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
          onValueChange={onUpdateDirection}
        >
          <div className="flex items-center space-x-[5px]">
            <RadioGroupItem
              className="w-3 h-3"
              value={UNLEARN}
              id={UNLEARN}
              color="#4d4d4d"
              checked={isUnlearnChecked}
            />
            <Label
              className="flex items-center text-sm text-[#4d4d4d]"
              htmlFor={UNLEARN}
            >
              <span>Above</span>
              <MoveRight className="w-2.5 h-2.5 mx-1" />
              <span>Model A/B</span>
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
            <Label
              className="flex items-center text-sm text-[#4d4d4d]"
              htmlFor={RETRAIN}
            >
              <span>Above</span>
              <MoveRight className="w-2.5 h-2.5 mx-1" />
              <span>Retrained</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex">
        <div className="mr-3">
          <p className="text-lg font-medium">Strategy</p>
          <p className="w-[120px] text-[13px] font-light">
            Choose how thresholds are determined:
          </p>
        </div>
        <Tabs
          value={strategy}
          onValueChange={(val: string) =>
            onUpdateStrategy({
              currentTarget: { innerHTML: val },
            } as React.MouseEvent<HTMLButtonElement>)
          }
          className="relative top-0.5"
        >
          <TabsList>
            {THRESHOLD_STRATEGIES.map((s, idx) => (
              <React.Fragment key={idx}>
                <TabsTrigger
                  value={s.strategy}
                  style={{ width: s.length }}
                  className="data-[state=active]:bg-[#585858] data-[state=active]:text-white"
                >
                  {s.strategy}
                </TabsTrigger>
                {idx < THRESHOLD_STRATEGIES.length - 1 &&
                  !(
                    s.strategy === strategy ||
                    THRESHOLD_STRATEGIES[idx + 1].strategy === strategy
                  ) && (
                    <Separator
                      orientation="vertical"
                      className="w-[1.5px] h-5 bg-[#d2d5d9]"
                    />
                  )}
              </React.Fragment>
            ))}
          </TabsList>
          {THRESHOLD_STRATEGIES.map((s, idx) => (
            <TabsContent
              key={idx}
              value={s.strategy}
              className="text-sm font-light"
            >
              {s.explanation}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <Separator
        orientation="horizontal"
        className="w-[calc(100%+12.8px)] h-[1px] absolute -bottom-0.5 -right-1.5"
      />
    </div>
  );
}
