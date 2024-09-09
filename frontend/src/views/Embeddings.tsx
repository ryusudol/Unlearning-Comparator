import { useState, useContext, useMemo, useCallback } from "react";

import SvgViewer from "../components/UI/SvgViewer";
import { retrainedData } from "../constants/gt";
import { OverviewContext } from "../store/overview-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { BaselineContext } from "../store/baseline-context";
import { Slider } from "../components/UI/slider";
import { TABLEAU10 } from "../constants/tableau10";
import { Label } from "../components/UI/label";
import { Switch } from "../components/UI/switch";
import {
  ChartScatterIcon,
  CircleIcon,
  CursorPointer01Icon,
  Drag01Icon,
  MultiplicationSignIcon,
  RepeatIcon,
  ScrollVerticalIcon,
} from "../components/UI/icons";

interface Props {
  height: number;
}

export default function Embeddings({ height }: Props) {
  const [neighbors, setNeighbors] = useState([5]);
  const [dist, setDist] = useState([0.1]);

  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);
  const { baseline } = useContext(BaselineContext);

  const currOverview = overview.filter(
    (item) => item.forget_class === baseline.toString()
  );

  const retrainByteSvgs = useMemo(
    () => Object.values(retrainedData[baseline].svg_files),
    [baseline]
  );
  const unlearnSvgs = useMemo(
    () => currOverview[selectedID]?.unlearn_svgs || [],
    [currOverview, selectedID]
  );

  const decoder = useCallback(
    () => retrainByteSvgs.slice(0, 4).map(atob),
    [retrainByteSvgs]
  );
  const retrainSvgs = useMemo(() => decoder(), [decoder]);

  const handleReplayClick = () => {
    console.log("Replay Button Clicked !");
  };

  return (
    <section
      style={{ height: `${height}` }}
      className="w-[1440px] h-[720px] px-[6px] py-[4px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex justify-between items-center mb-[2px]">
        <div className="flex items-center">
          <ChartScatterIcon />
          <h5 className="font-semibold ml-[3px]">Embeddings</h5>
        </div>
        <div className="w-[680px] flex justify-end items-center">
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
        <div className="w-[116px] h-[650px] flex flex-col justify-center items-center">
          {/* Legend - Metadata */}
          <div className="w-full h-[98px] flex flex-col justify-start items-start mb-[5px] px-2 py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <span className="text-[15px]">Metadata</span>
            <div className="flex flex-col justify-start items-start">
              <span className="text-[15px] font-light">Points: 2000</span>
              <span className="text-[15px] font-light -my-[2px]">
                Dimension: 8192
              </span>
              <span className="text-[15px] font-light">Dataset: Train</span>
            </div>
          </div>
          {/* Legend - Controls */}
          <div className="w-full h-[98px] flex flex-col justify-start items-start mb-[5px] px-[10px] py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
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
          <div className="w-full h-20 flex flex-col justify-start items-start mb-[5px] px-[10px] py-[5px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
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
          <div className="w-full h-[358px] flex flex-col justify-start items-start px-[10px] py-[7px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <span className="text-[15px]">Predictions</span>
            <div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[0]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">airplane</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[1]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">automobile</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[2]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">bird</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[3]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">cat</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[4]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">deer</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[5]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">dog</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[6]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">frog</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[7]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">horse</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[8]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">ship</span>
              </div>
              <div className="flex items-center mb-[2px]">
                <div
                  style={{ backgroundColor: `${TABLEAU10[9]}` }}
                  className="w-[14px] h-[30px] mr-[6px]"
                />
                <span className="text-[15px] font-light">truck</span>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[645px] w-[1.5px] bg-[#dfdfdf] mx-0" />
        <div className="flex flex-col justify-center items-center relative">
          <div className="absolute flex items-center space-x-2 top-8 right-1">
            <Switch id="highlight-1" checked={false} />
            <Label htmlFor="highlight-1" className="font-light">
              Highlight
            </Label>
          </div>
          <h5 className="relative top-2">Comparison Model</h5>
          <SvgViewer mode={0} svg={retrainSvgs[3]} />
        </div>
        <div className="h-[645px] w-[1.5px] bg-[#dfdfdf] mx-0" />
        <div className="flex flex-col justify-center items-center relative">
          <div className="absolute flex items-center space-x-2 top-8 right-1">
            <Switch id="highlight-2" checked />
            <Label htmlFor="highlight-2" className="font-light">
              Highlight
            </Label>
          </div>
          <h5 className="relative top-2">Proposed Model</h5>
          <SvgViewer mode={1} svg={retrainSvgs[3]} />
        </div>
      </div>
    </section>
  );
}
