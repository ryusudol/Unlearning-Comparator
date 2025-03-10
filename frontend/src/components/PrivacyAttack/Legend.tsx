import React from "react";
import { MoveRight } from "lucide-react";

import Button from "../CustomButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../UI/tabs";
import { useThresholdStore } from "../../stores/thresholdStore";
import { useAttackStateStore } from "../../stores/attackStore";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { Separator } from "../UI/separator";
import { Label } from "../UI/label";
import { COLORS } from "../../constants/colors";
import { ENTROPY, CONFIDENCE, UNLEARN, RETRAIN } from "../../constants/common";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../UI/hover-card";

export default function Legend() {
  const strategyThresholds = useThresholdStore(
    (state) => state.strategyThresholds
  );
  const {
    metric,
    direction,
    strategy,
    setMetric,
    setDirection,
    setStrategy,
    setWorstCaseModel,
  } = useAttackStateStore();

  const isEntropyChecked = metric === ENTROPY;
  const isUnlearnChecked = direction === UNLEARN;
  const displayStrategy =
    strategy === "BEST_ATTACK" ? THRESHOLD_STRATEGIES[1].strategy : strategy;

  return (
    <div className="w-full flex justify-between px-3.5 pt-2 pb-[18px] text-sm z-10 relative top-1">
      <div className="flex items-center gap-2.5 relative top-0.5">
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <Button
              style={{ backgroundColor: COLORS.EMERALD }}
              className="w-[115px] h-[70px] text-xl font-medium leading-5 rounded-md"
              onClick={() => {
                setStrategy("BEST_ATTACK");
                setWorstCaseModel("A");
              }}
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
              onClick={() => {
                setStrategy("BEST_ATTACK");
                setWorstCaseModel("B");
              }}
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
      <div className="flex flex-col">
        <p className="text-lg font-medium">Metric</p>
        <RadioGroup
          className="flex flex-col gap-1"
          value={metric}
          onValueChange={setMetric}
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
      <div className="flex flex-col">
        <p className="text-lg font-medium text-nowrap">Direction</p>
        <RadioGroup
          className="flex flex-col gap-1 text-nowrap"
          value={direction}
          onValueChange={setDirection}
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
        <div className="mr-3.5">
          <p className="text-lg font-medium">Strategy</p>
          <p className="w-[120px] text-[13px] font-light">
            Choose how thresholds are determined:
          </p>
        </div>
        <Tabs
          value={displayStrategy}
          onValueChange={(val: string) => setStrategy(val)}
          className="relative top-0.5"
        >
          <TabsList className="h-12">
            {THRESHOLD_STRATEGIES.map((s, idx) => (
              <React.Fragment key={idx}>
                <TabsTrigger
                  value={s.strategy}
                  style={{ width: s.length }}
                  className="h-10 data-[state=active]:bg-[#585858] data-[state=active]:text-white"
                >
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger>
                      <p className="leading-[13px]">
                        {s.strategy}
                        <br />
                        <span className="text-[11px]">
                          (A: {strategyThresholds["A"][idx].toFixed(2)}, B:{" "}
                          {strategyThresholds["B"][idx].toFixed(2)})
                        </span>
                      </p>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto px-3 py-2" side="top">
                      {s.explanation}
                    </HoverCardContent>
                  </HoverCard>
                </TabsTrigger>
                {idx < THRESHOLD_STRATEGIES.length - 1 && (
                  <Separator
                    orientation="vertical"
                    className={`w-[1.5px] h-5 ${
                      s.strategy === strategy ||
                      THRESHOLD_STRATEGIES[idx + 1].strategy === strategy
                        ? "bg-muted"
                        : "bg-[#d2d5d9]"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </TabsList>
          {THRESHOLD_STRATEGIES.map((s, idx) => (
            <TabsContent
              key={idx}
              value={s.strategy}
              className="absolute -bottom-1 left-0 text-sm font-light"
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
