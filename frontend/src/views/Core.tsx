import React, { useState, useEffect } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Embedding from "./Embedding";
import PrivacyAttack from "./PrivacyAttack";
import { CONFIG } from "../app/App";
import { fetchFileData, fetchAllWeightNames } from "../utils/api/unlearning";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { Point } from "../types/data";

const EMBEDDINGS = "embeddings";
const ATTACK = "attack";

export default function Core() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [displayMode, setDisplayMode] = useState(EMBEDDINGS);
  const [modelAPoints, setModelAPoints] = useState<Point[]>([]);
  const [modelBPoints, setModelBPoints] = useState<Point[]>([]);

  const isEmbeddingMode = displayMode === EMBEDDINGS;
  const forgetClassExist = forgetClass !== -1;

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;

    if (id === EMBEDDINGS) {
      setDisplayMode(EMBEDDINGS);
    } else {
      setDisplayMode(ATTACK);
    }
  };

  useEffect(() => {
    async function loadModelAData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(forgetClass);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!modelA || !slicedIds.includes(modelA)) return;

      try {
        const data = await fetchFileData(forgetClass, modelA);
        setModelAPoints(data.points);
      } catch (error) {
        console.error(`Failed to fetch an model A data file: ${error}`);
        setModelAPoints([]);
      }
    }
    loadModelAData();
  }, [forgetClass, forgetClassExist, modelA]);

  useEffect(() => {
    async function loadModelBData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(forgetClass);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!modelB || !slicedIds.includes(modelB)) return;

      try {
        const data = await fetchFileData(forgetClass, modelB);
        setModelBPoints(data.points);
      } catch (error) {
        console.error(`Error fetching model B file data: ${error}`);
        setModelBPoints([]);
      }
    }
    loadModelBData();
  }, [forgetClass, forgetClassExist, modelB]);

  return (
    <View width={CONFIG.CORE_WIDTH} height={CONFIG.CORE_HEIGHT} borderTop>
      <div className="flex items-center gap-1 mb-1.5 ml-1 relative right-1">
        <Title
          title="Embedding Space"
          id={EMBEDDINGS}
          className={`relative z-10 cursor-pointer px-1 ${
            !isEmbeddingMode && "text-gray-400 border-none"
          }`}
          AdditionalContent={isEmbeddingMode && <UnderLine />}
          onClick={handleDisplayModeChange}
        />
        <Title
          title="Attack Simulation"
          id={ATTACK}
          className={`relative z-10 cursor-pointer px-1 ${
            isEmbeddingMode && "text-gray-400 border-none"
          }`}
          AdditionalContent={!isEmbeddingMode && <UnderLine />}
          onClick={handleDisplayModeChange}
        />
      </div>
      {forgetClassExist ? (
        isEmbeddingMode ? (
          <Embedding modelAPoints={modelAPoints} modelBPoints={modelBPoints} />
        ) : (
          <PrivacyAttack
            modelAPoints={modelAPoints}
            modelBPoints={modelBPoints}
          />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}

function UnderLine() {
  return <div className="absolute w-full h-0.5 bg-black right-0 -bottom-0.5" />;
}
