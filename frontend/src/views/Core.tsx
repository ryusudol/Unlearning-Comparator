import React, { useState, useEffect, useContext } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Embeddings from "./Embeddings";
import PrivacyAttack from "./PrivacyAttack";
import { fetchFileData, fetchAllWeightNames } from "../utils/api/unlearning";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { useForgetClass } from "../hooks/useForgetClass";
import { ViewProps } from "../types/common";
import { Point } from "../types/data";

const EMBEDDINGS = "embeddings";
const ATTACK = "attack";
const HEIGHT = 635;

export default function Core({ width, height }: ViewProps) {
  const { forgetClassExist, forgetClassNumber } = useForgetClass();

  const { baseline, comparison } = useContext(BaselineComparisonContext);

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

      if (!baseline || !slicedIds.includes(baseline)) return;

      try {
        const data = await fetchFileData(forgetClassNumber, baseline);
        setBaselinePoints(data.points);
      } catch (error) {
        console.error(`Failed to fetch an unlearned data file: ${error}`);
        setBaselinePoints([]);
      }
    }
    loadBaselineData();
  }, [baseline, forgetClassExist, forgetClassNumber]);

  useEffect(() => {
    async function loadComparisonData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(forgetClassNumber);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!comparison || !slicedIds.includes(comparison)) return;

      try {
        const data = await fetchFileData(forgetClassNumber, comparison);
        setComparisonPoints(data.points);
      } catch (error) {
        console.error(`Error fetching comparison file data: ${error}`);
        setComparisonPoints([]);
      }
    }
    loadComparisonData();
  }, [comparison, forgetClassExist, forgetClassNumber]);

  const content = forgetClassExist ? (
    isEmbeddingMode ? (
      <Embeddings
        height={HEIGHT}
        baselinePoints={baselinePoints}
        comparisonPoints={comparisonPoints}
      />
    ) : (
      <PrivacyAttack
        height={HEIGHT}
        baselinePoints={baselinePoints}
        comparisonPoints={comparisonPoints}
      />
    )
  ) : (
    <Indicator about="ForgetClass" />
  );

  return (
    <View width={width} height={height} className="border-l-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 mb-0.5 relative right-1">
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
