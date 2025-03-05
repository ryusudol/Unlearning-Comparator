import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../UI/tabs";
import { Separator } from "../UI/separator";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { CIFAR_10_CLASSES } from "../../constants/common";
import { TABLEAU10 } from "../../constants/colors";
import { CircleIcon, FatMultiplicationSignIcon } from "../UI/icons";
import { VIEW_MODES } from "../../constants/embeddings";

interface Props {
  highlight: string;
  setHighlight: (mode: string) => void;
}

export default function EmbeddingsLegend({ highlight, setHighlight }: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);

  const oddIndices = CIFAR_10_CLASSES.filter((_, idx) => idx % 2 === 0);
  const evenIndices = CIFAR_10_CLASSES.filter((_, idx) => idx % 2 !== 0);

  return (
    <div className="w-full flex justify-between px-3.5 pb-[18px] text-sm z-10 relative top-3">
      <div className="flex flex-col">
        <p className="text-lg font-medium mb-1">True Class</p>
        <ul className="flex flex-col gap-1">
          <li className="flex items-center text-nowrap">
            <CircleIcon className="w-2 h-2 mr-1.5 relative left-[1px]" />
            <span>Retain Class</span>
          </li>
          <li className="flex items-center">
            <FatMultiplicationSignIcon className="w-2.5 h-2.5 mr-1" />
            <span>Forget Class</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col">
        <p className="text-lg font-medium mb-1">Predicted Class</p>
        <div
          style={{ gridTemplateColumns: "105px 70px 70px 70px 45px" }}
          className="grid gap-y-1"
        >
          {oddIndices.map((name, idx) => {
            const originalIdx = idx * 2;
            return (
              <li key={originalIdx} className="flex items-center">
                <div
                  style={{ backgroundColor: TABLEAU10[originalIdx] }}
                  className="w-3 h-4 mr-[5px]"
                />
                <span>
                  {forgetClass === originalIdx ? name + " (X)" : name}
                </span>
              </li>
            );
          })}
          {evenIndices.map((name, idx) => {
            const originalIdx = idx * 2 + 1;
            return (
              <li key={originalIdx} className="flex items-center">
                <div
                  style={{ backgroundColor: TABLEAU10[originalIdx] }}
                  className="w-3 h-4 mr-[5px]"
                />
                <span>
                  {forgetClass === originalIdx ? name + " (X)" : name}
                </span>
              </li>
            );
          })}
        </div>
      </div>

      <div className="flex">
        <div className="mr-4">
          <p className="text-lg font-medium mb-[5px]">Highlight</p>
          <p className="w-[102px] text-sm font-light">
            Choose a category to emphasize:
          </p>
        </div>
        <Tabs
          value={highlight}
          onValueChange={setHighlight}
          className="relative top-0.5"
        >
          <TabsList>
            {VIEW_MODES.map((mode, idx) => (
              <React.Fragment key={idx}>
                <TabsTrigger
                  value={mode.label}
                  style={{ width: mode.length }}
                  className="data-[state=active]:bg-[#585858] data-[state=active]:text-white"
                >
                  {mode.label}
                </TabsTrigger>
                {idx < VIEW_MODES.length - 1 &&
                  !(
                    mode.label === highlight ||
                    VIEW_MODES[idx + 1].label === highlight
                  ) && (
                    <Separator
                      orientation="vertical"
                      className="h-5 bg-[#aeaeae]"
                    />
                  )}
              </React.Fragment>
            ))}
          </TabsList>
          {VIEW_MODES.map((mode, idx) => (
            <TabsContent
              key={idx}
              value={mode.label}
              className="text-sm font-light"
            >
              {mode.explanation}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <Separator
        orientation="horizontal"
        className="w-[calc(100%+12.8px)] h-[1px] absolute bottom-0 -right-1.5"
      />
    </div>
  );
}
