import React, { useState } from "react";

import Embeddings from "./Embeddings";
import PrivacyAttack from "./PrivacyAttack";
import { Slider } from "../components/ui/slider";
import { ChartScatterIcon, RepeatIcon } from "../components/ui/icons";

const EMBEDDINGS = "embeddings";
const ATTACK = "attack";

interface Props {
  height: number;
}

export default function Core({ height }: Props) {
  const [displayMode, setDisplayMode] = useState(EMBEDDINGS);
  const [neighbors, setNeighbors] = useState([5]);
  const [dist, setDist] = useState([0.1]);

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === EMBEDDINGS) setDisplayMode(EMBEDDINGS);
    else setDisplayMode(ATTACK);
  };

  const handleReplayClick = () => {
    console.log("Replay Button Clicked !");
  };

  return (
    <section
      style={{ height: `${height}` }}
      className="w-[1440px] px-[5px] py-[4px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex justify-between items-center mb-[2px]">
        <div className="flex items-center">
          <div
            id={EMBEDDINGS}
            onClick={handleDisplayModeChange}
            className={`z-10 flex items-center mr-3 cursor-pointer border-b-[2px] border-black px-[6px] ${
              displayMode === ATTACK && "text-gray-400 border-none"
            }`}
          >
            <ChartScatterIcon
              className={displayMode === ATTACK ? "opacity-40" : ""}
            />
            <h5 className="font-semibold ml-[3px]">Embeddings</h5>
          </div>
          <div
            className={`z-10 flex items-center cursor-pointer border-b-[2px] border-black px-[6px] ${
              displayMode === EMBEDDINGS && "text-gray-400 border-none"
            }`}
          >
            <img
              src="/hacker.png"
              alt="Attack logo img"
              className={`w-4 ${displayMode === EMBEDDINGS && "opacity-40"}`}
            />
            <h5
              id={ATTACK}
              onClick={handleDisplayModeChange}
              className="font-semibold ml-[3px]"
            >
              Privacy Attack
            </h5>
          </div>
        </div>
        {displayMode === EMBEDDINGS && (
          <div className="w-[680px] flex justify-end items-center z-10">
            <div className="flex items-center">
              <span>neighbors</span>
              <div className="flex items-center">
                <Slider
                  onValueChange={(value: number[]) => setNeighbors(value)}
                  value={neighbors}
                  defaultValue={[5]}
                  className="w-[100px] mx-2 cursor-pointer"
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
                  className="w-[100px] mx-2 cursor-pointer"
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
        )}
      </div>
      {displayMode === EMBEDDINGS ? <Embeddings /> : <PrivacyAttack />}
    </section>
  );
}
