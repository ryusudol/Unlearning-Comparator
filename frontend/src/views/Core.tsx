import React, { useState } from "react";

import Embeddings from "./Embeddings";
import PrivacyAttack from "./PrivacyAttack";
import { ChartScatterIcon } from "../components/UI/icons";

const EMBEDDINGS = "embeddings";
const ATTACK = "attack";
const HEIGHT = 635;

export default function Core({ height }: { height: number }) {
  const [displayMode, setDisplayMode] = useState(EMBEDDINGS);

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    if (id === EMBEDDINGS) setDisplayMode(EMBEDDINGS);
    else setDisplayMode(ATTACK);
  };

  const isEmbeddingMode = displayMode === EMBEDDINGS;

  return (
    <section
      style={{ height }}
      className="w-[1382px] p-1 border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex items-center mb-0.5">
        <div
          id={EMBEDDINGS}
          onClick={handleDisplayModeChange}
          className={`relative z-10 flex items-center mr-3 cursor-pointer pb-0.5 px-1 ${
            !isEmbeddingMode && "text-gray-400 border-none"
          }`}
        >
          <ChartScatterIcon className={!isEmbeddingMode ? "opacity-40" : ""} />
          <button className="font-semibold ml-[3px] text-lg">Embeddings</button>
          {isEmbeddingMode && (
            <div className="absolute w-full h-0.5 bg-black right-0 bottom-[3px]" />
          )}
        </div>
        <div
          onClick={handleDisplayModeChange}
          className={`relative z-10 flex items-center cursor-pointer pb-0.5 px-1 ${
            isEmbeddingMode && "text-gray-400 border-none"
          }`}
        >
          <img
            src="/hacker.png"
            alt="Attack logo img"
            className={`w-4 ${isEmbeddingMode && "opacity-40"}`}
          />
          <button id={ATTACK} className="font-semibold ml-[3px] text-lg">
            Privacy Attack
          </button>
          {!isEmbeddingMode && (
            <div className="absolute w-full h-0.5 bg-black right-0 bottom-[3px]" />
          )}
        </div>
      </div>
      {isEmbeddingMode ? (
        <Embeddings height={HEIGHT} />
      ) : (
        <PrivacyAttack height={HEIGHT} />
      )}
    </section>
  );
}
