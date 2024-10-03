import React, { useState, useRef, useMemo } from "react";
import * as d3 from "d3";
import { AiOutlineHome } from "react-icons/ai";

import Chart from "../components/Chart";
import ToggleGroup from "../components/ToggleGroup";
import { Slider } from "../components/ui/slider";
import { Separator } from "../components/ui/separator";
import { TABLEAU10 } from "../constants/tableau10";
import {
  ChartScatterIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  RepeatIcon,
  ScrollVerticalIcon,
  NeuralNetworkIcon,
  GitCompareIcon,
} from "../components/ui/icons";

const classNames = [
  "airplane",
  "automobile",
  "bird",
  "cat",
  "deer",
  "dog",
  "frog",
  "horse",
  "ship",
  "truck",
];
const dotCount = 200;
const generateData = () => {
  const random = d3.randomNormal(0, 0.2);
  const sqrt3 = Math.sqrt(3);

  const result: number[][] = [];

  result.push(
    ...Array.from({ length: dotCount }, () => [
      random() + sqrt3,
      random() + 1,
      0,
    ]),
    ...Array.from({ length: dotCount }, () => [
      random() - sqrt3,
      random() + 1,
      1,
    ]),
    ...Array.from({ length: dotCount }, () => [random(), random() - 1, 2]),
    ...Array.from({ length: dotCount }, () => [
      random() + sqrt3,
      random() - sqrt3,
      3,
    ]),
    ...Array.from({ length: dotCount }, () => [
      random() - sqrt3,
      random() - sqrt3,
      4,
    ]),
    ...Array.from({ length: dotCount }, () => [
      random() + 2 * sqrt3,
      random() + 1,
      5,
    ]),
    ...Array.from({ length: dotCount }, () => [
      random() - 2 * sqrt3,
      random() + 1,
      6,
    ]),
    ...Array.from({ length: dotCount }, () => [random() + 2, random() - 1, 7]),
    ...Array.from({ length: dotCount }, () => [random() - 2, random() - 1, 8]),
    ...Array.from({ length: dotCount }, () => [
      random() * 1.5,
      random() * 1.5,
      9,
    ])
  );

  return result;
};

interface Props {
  height: number;
}

export default function Embeddings({ height }: Props) {
  const [neighbors, setNeighbors] = useState([5]);
  const [dist, setDist] = useState([0.1]);

  const baselineChartRef = useRef<{ reset: () => void } | null>(null);
  const comparisonChartRef = useRef<{ reset: () => void } | null>(null);

  const data = useMemo(() => generateData(), []);

  const handleReplayClick = () => {
    console.log("Replay Button Clicked !");
  };

  const handleResetClick = (e: React.MouseEvent) => {
    const id = e.currentTarget.id;
    const ref = id === "baseline" ? baselineChartRef : comparisonChartRef;
    if (ref.current && typeof ref.current.reset === "function") {
      ref.current.reset();
    }
  };

  return (
    <section
      style={{ height: `${height}` }}
      className="w-[1440px] px-[5px] py-[4px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex justify-between items-center mb-[2px]">
        <div className="flex items-center">
          <ChartScatterIcon />
          <h5 className="font-semibold ml-[3px]">Embeddings</h5>
        </div>
        <div className="w-[680px] flex justify-end items-center z-10">
          <div className="flex items-center">
            <span>neighbors</span>
            <div className="flex items-center">
              <Slider
                onValueChange={(value: number[]) => setNeighbors(value)}
                value={neighbors}
                defaultValue={[5]}
                className="w-44 mx-2 cursor-pointer"
                min={5}
                max={15}
                step={1}
              />
              <span className="w-2 text-[14px]">{neighbors}</span>
            </div>
          </div>
          <div className="flex items-center mx-8">
            <span>min_dist</span>
            <div className="flex items-center">
              <Slider
                onValueChange={(value: number[]) => setDist(value)}
                value={dist}
                defaultValue={[0.1]}
                className="w-44 mx-2 cursor-pointer"
                min={0.1}
                max={0.5}
                step={0.05}
              />
              <span className="w-4 text-[14px]">{dist}</span>
            </div>
          </div>
          <RepeatIcon
            onClick={handleReplayClick}
            className="scale-125 cursor-pointer mr-2"
          />
        </div>
      </div>
      <div className="w-[1428px] h-[683px] flex justify-evenly items-center border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
        <div className="w-[116px] h-[660px] flex flex-col justify-center items-center">
          {/* Legend - Metadata */}
          <div className="w-full h-[105px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <span className="text-[15px]">Metadata</span>
            <div className="flex flex-col justify-start items-start">
              <span className="text-[15px] font-light">
                Points: {dotCount * 10}
              </span>
              <span className="text-[15px] font-light">Dimension: 8192</span>
              <span className="text-[15px] font-light">Dataset: Training</span>
            </div>
          </div>
          {/* Legend - Controls */}
          <div className="w-full h-[105px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <span className="text-[15px]">Controls</span>
            <div>
              <div className="flex items-center">
                <CursorPointer01Icon className="scale-110 mr-[6px]" />
                <span className="text-[15px] font-light">Details</span>
              </div>
              <div className="flex items-center -my-[2px]">
                <ScrollVerticalIcon className="scale-110 mr-[6px]" />
                <span className="text-[15px] font-light">Zooming</span>
              </div>
              <div className="flex items-center">
                <Drag01Icon className="scale-110 mr-[6px]" />
                <span className="text-[15px] font-light">Panning</span>
              </div>
            </div>
          </div>
          {/* Legend - Data Type */}
          <div className="w-full h-[85px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <span className="text-[15px]">Data Type</span>
            <div>
              <div className="flex items-center text-[15px] font-light">
                <CircleIcon className="scale-75 mr-[6px]" />
                <span>Retrained</span>
              </div>
              <div className="flex items-center text-[15px] font-light">
                <MultiplicationSignIcon className="scale-125 mr-[6px]" />
                <span>Forgotten</span>
              </div>
            </div>
          </div>
          {/* Legend - Predictions */}
          <div className="w-full h-[358px] flex flex-col justify-start items-start pl-2 pr-[2px] py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <span className="text-[15px]">Predictions</span>
            <div>
              {classNames.map((className, idx) => (
                <div className="flex items-center mb-[2px]">
                  <div
                    style={{ backgroundColor: `${TABLEAU10[idx]}` }}
                    className="w-[14px] h-[30px] mr-1"
                  />
                  <span className="text-[15px] font-light">
                    {idx} ({className})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Separator
          orientation="vertical"
          className="h-[664px] w-[1px] mx-[2px]"
        />
        <div className="flex flex-col items-center relative">
          <div className="flex items-center absolute top-[30px] left-0">
            <AiOutlineHome
              id="baseline"
              className="mr-1 scale-90 cursor-pointer"
              onClick={handleResetClick}
            />
            <span className="text-[13px] font-light">
              | Predictions: 6 | Ground Truth: 6
            </span>
          </div>
          <div className="flex relative top-7 items-center">
            <div className="flex items-center">
              <NeuralNetworkIcon className="mr-[2px]" />
              <h5 className="text-[15px] ml-[2px]">Baseline Model (id01)</h5>
            </div>
          </div>
          <ToggleGroup />
          <div className="w-[630px] h-[668px] flex flex-col justify-center items-center">
            <Chart
              data={data}
              width={620}
              height={630}
              ref={baselineChartRef}
            />
          </div>
        </div>
        <Separator
          orientation="vertical"
          className="h-[664px] w-[1px] mx-[2px]"
        />
        <div className="flex flex-col items-center relative">
          <div className="flex items-center absolute top-[30px] left-0">
            <AiOutlineHome
              id="comparison"
              className="mr-1 scale-90 cursor-pointer"
              onClick={handleResetClick}
            />
            <span className="text-[13px] font-light">
              | Predictions: 6 | Ground Truth: 6
            </span>
          </div>
          <div className="flex relative top-7 items-center">
            <div className="flex items-center">
              <GitCompareIcon className="mr-[2px]" />
              <h5 className="text-[15px] ml-[2px]">Comparison Model (id02)</h5>
            </div>
          </div>
          <ToggleGroup />
          <div className="w-[630px] h-[668px] flex flex-col justify-center items-center">
            <img src="/comparison.png" alt="comparison model img" />
            {/* <Chart
              data={data}
              width={620}
              height={630}
              ref={comparisonChartRef}
            /> */}
          </div>
        </div>
      </div>
    </section>
  );
}
