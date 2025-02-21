import React, { useState, useEffect } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Embedding from "./Embedding";
import PrivacyAttack from "./PrivacyAttack";
import { CONFIG } from "../app/App";
import { fetchFileData, fetchAllWeightNames } from "../utils/api/unlearning";
import { useForgetClass } from "../hooks/useForgetClass";
import { useModelDataStore } from "../stores/modelDataStore";
import { Point } from "../types/data";

const EMBEDDINGS = "embeddings";
const ATTACK = "attack";

export default function Core() {
  const { forgetClassExist, forgetClassNumber } = useForgetClass();
  const { modelA, modelB } = useModelDataStore();

  const [displayMode, setDisplayMode] = useState(EMBEDDINGS);
  const [baselinePoints, setBaselinePoints] = useState<Point[]>([]);
  const [comparisonPoints, setComparisonPoints] = useState<Point[]>([]);

  const isEmbeddingMode = displayMode === EMBEDDINGS;

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;

    if (id === EMBEDDINGS) {
      setDisplayMode(EMBEDDINGS);
    } else {
      setDisplayMode(ATTACK);
    }
  };

  useEffect(() => {
    async function loadBaselineData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(forgetClassNumber);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!modelA || !slicedIds.includes(modelA)) return;

      try {
        const data = await fetchFileData(forgetClassNumber, modelA);
        setBaselinePoints(data.points);
      } catch (error) {
        console.error(`Failed to fetch an unlearned data file: ${error}`);
        setBaselinePoints([]);
      }
    }
    loadBaselineData();
  }, [modelA, forgetClassExist, forgetClassNumber]);

  useEffect(() => {
    async function loadComparisonData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(forgetClassNumber);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!modelB || !slicedIds.includes(modelB)) return;

      try {
        const data = await fetchFileData(forgetClassNumber, modelB);
        setComparisonPoints(data.points);
      } catch (error) {
        console.error(`Error fetching comparison file data: ${error}`);
        setComparisonPoints([]);
      }
    }
    loadComparisonData();
  }, [modelB, forgetClassExist, forgetClassNumber]);

  const content = forgetClassExist ? (
    isEmbeddingMode ? (
      <Embedding
        baselinePoints={baselinePoints}
        comparisonPoints={comparisonPoints}
      />
    ) : (
      <PrivacyAttack
        baselinePoints={baselinePoints}
        comparisonPoints={comparisonPoints}
      />
    )
  ) : (
    <Indicator about="ForgetClass" />
  );

  return (
    <View
      width={CONFIG.CORE_WIDTH}
      height={CONFIG.CORE_HEIGHT}
      className="border-l-0"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 mb-0.5 ml-1 relative right-1">
          <Title
            title="Embedding"
            id={EMBEDDINGS}
            customClass={`relative z-10 cursor-pointer pb-0.5 px-1 ${
              !isEmbeddingMode && "text-gray-400 border-none"
            }`}
            AdditionalContent={isEmbeddingMode && <UnderLine />}
            onClick={handleDisplayModeChange}
          />
          <Title
            title="Privacy Attack"
            id={ATTACK}
            customClass={`relative z-10 cursor-pointer pb-0.5 px-1 ${
              isEmbeddingMode && "text-gray-400 border-none"
            }`}
            AdditionalContent={!isEmbeddingMode && <UnderLine />}
            onClick={handleDisplayModeChange}
          />
        </div>
      </div>
      {content}
    </View>
  );
}

function UnderLine() {
  return (
    <div className="absolute w-full h-0.5 bg-black right-0 bottom-[3px]" />
  );
}
