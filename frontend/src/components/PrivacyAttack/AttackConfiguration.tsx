import React from "react";

import {
  ATTACK_METHODS,
  THRESHOLD_STRATEGIES,
} from "../../constants/privacyAttack";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";

interface Props {
  onAttackChange: (method: string) => void;
  thresholdStrategy: string;
  onThresholdChange: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Attackconfiguration({
  onAttackChange,
  thresholdStrategy,
  onThresholdChange,
}: Props) {
  return (
    <div className="w-[130px] h-full flex flex-col ml-1.5 mr-1">
      <div className="flex flex-col mb-5">
        <span className="mb-0.5 text-[15px]">Attack Metric</span>
        <Select defaultValue={ATTACK_METHODS[0]} onValueChange={onAttackChange}>
          <SelectTrigger className="h-[25px] mb-1.5 text-sm font-light">
            <SelectValue placeholder={ATTACK_METHODS[0]} />
          </SelectTrigger>
          <SelectContent>
            {ATTACK_METHODS.map((method) => {
              return (
                <SelectItem
                  key={method}
                  value={method}
                  className="text-sm font-light"
                >
                  {method}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <p className="text-xs font-extralight leading-[14px]">
          Simulate a membership inference attack using the model’s output logit
          entropy
        </p>
      </div>
      <div className="flex flex-col mb-5">
        <span className="mb-0.5 text-[15px]">Threshold Strategy</span>
        <div className="flex flex-col gap-2">
          {THRESHOLD_STRATEGIES.map((item, idx) => {
            const firstSpaceIdx = item.strategy.indexOf(" ");
            const firstChunk = item.strategy.slice(0, firstSpaceIdx);
            const secondChunk = item.strategy.slice(firstSpaceIdx + 1);

            return (
              <div className="flex flex-col">
                <div
                  id={item.strategy}
                  key={item.strategy}
                  onClick={onThresholdChange}
                  className="bg-[#cc0000] hover:bg-[#dd0000] transition text-white text-sm font-semibold mb-0.5 py-1 rounded-lg text-center cursor-pointer"
                >
                  {firstChunk}
                  <br />
                  {secondChunk}
                </div>
                <span className="text-xs font-extralight leading-[14px]">
                  {item.introduction}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-[#cc0000]">
        <span className="text-sm font-medium">{thresholdStrategy}</span>
        <p className="text-xs font-extralight leading-[14px]">
          {
            THRESHOLD_STRATEGIES.find(
              (item) => item.strategy === thresholdStrategy
            )?.explanation
          }
        </p>
      </div>
    </div>
  );
}
