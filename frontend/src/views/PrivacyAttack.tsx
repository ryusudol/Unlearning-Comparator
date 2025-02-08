import { useState } from "react";

import View from "../components/View";
import AttackPlot from "../components/PrivacyAttack/AttackPlot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/UI/select";
import { Separator } from "../components/UI/separator";
import { ATTACK_METHODS, THRESHOLD_METHODS } from "../constants/privacyAttack";

export default function PrivacyAttack({ height }: { height: number }) {
  const [attackMethod, setAttackMethod] = useState(ATTACK_METHODS[0]);
  const [thresholdMethod, setThresholdMethod] = useState(THRESHOLD_METHODS[0]);

  const handleAttackMethodChange = (method: string) => {
    setAttackMethod(method);
  };

  const handleThresholdMethodClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const method = e.currentTarget.innerHTML;
    setThresholdMethod(method);
  };

  return (
    <View
      height={height}
      className="w-full flex justify-evenly items-start rounded-[6px] px-1.5"
    >
      <div className="max-w-[150px] h-full flex flex-col justify-between text-[17px]">
        <div className="flex flex-col">
          <span className="mb-0.5">Attack by</span>
          <Select
            defaultValue={ATTACK_METHODS[0]}
            onValueChange={handleAttackMethodChange}
          >
            <SelectTrigger className="h-[25px] text-base mb-1.5">
              <SelectValue placeholder={ATTACK_METHODS[0]} />
            </SelectTrigger>
            <SelectContent>
              {ATTACK_METHODS.map((method, idx) => {
                return (
                  <SelectItem key={idx} value={method}>
                    {method}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs">
            Membership Inference
            <br />
            Attack by output logit
            <br />
            entropy 수행
          </p>
        </div>
        <div>
          <span>Thresholding by</span>
          <div className="flex flex-col gap-4">
            {THRESHOLD_METHODS.map((method, idx) => (
              <div className="flex flex-col">
                <div
                  key={idx}
                  onClick={handleThresholdMethodClick}
                  className="bg-[#cc0000] hover:bg-[#dd0000] transition text-white font-semibold px-4 py-2 rounded-lg text-center cursor-pointer"
                >
                  {method}
                </div>
                <span className="text-xs font-light">
                  {idx === 0
                    ? "Minimize log"
                    : idx === 1
                    ? "Equality"
                    : "Equality2"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[#cc0000]">
          <span>{thresholdMethod}</span>
          <p className="text-xs">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Deserunt,
            pariatur. Sapiente nobis exercitationem obcaecati ducimus
          </p>
        </div>
      </div>
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <AttackPlot mode="Baseline" />
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" />
      <AttackPlot mode="Comparison" />
    </View>
  );
}
