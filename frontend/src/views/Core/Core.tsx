import React, { useState, useEffect } from "react";

import View from "../../components/common/View";
import Title from "../../components/common/Title";
import Indicator from "../../components/common/Indicator";
import Embedding from "./Embedding";
// import GradCam from "./GradCam";
import PrivacyAttack from "./PrivacyAttack";
import { CONFIG } from "../../app/App";
import { useDatasetMode } from "../../hooks/useDatasetMode";
import { fetchFileData, fetchAllWeightNames } from "../../utils/api/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useModelDataStore } from "../../stores/modelDataStore";
import { Point } from "../../types/data";
import { cn } from "../../utils/util";

const FIRST = "first";
const SECOND = "second";

export default function Core() {
  const datasetMode = useDatasetMode();

  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [displayMode, setDisplayMode] = useState(FIRST);
  const [modelAPoints, setModelAPoints] = useState<Point[]>([]);
  const [modelBPoints, setModelBPoints] = useState<Point[]>([]);

  const isFirstMode = displayMode === FIRST;
  const forgetClassExist = forgetClass !== -1;

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;

    if (id === FIRST) {
      setDisplayMode(FIRST);
    } else {
      setDisplayMode(SECOND);
    }
  };

  useEffect(() => {
    async function loadModelAData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(datasetMode, forgetClass);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!modelA || !slicedIds.includes(modelA)) return;

      try {
        const data = await fetchFileData(datasetMode, forgetClass, modelA);
        setModelAPoints(data.points);
      } catch (error) {
        console.error(`Failed to fetch an model A data file: ${error}`);
        setModelAPoints([]);
      }
    }
    loadModelAData();
  }, [datasetMode, forgetClass, forgetClassExist, modelA]);

  useEffect(() => {
    async function loadModelBData() {
      if (!forgetClassExist) return;

      const ids: string[] = await fetchAllWeightNames(datasetMode, forgetClass);
      const slicedIds = ids.map((id) => id.slice(0, -4));

      if (!modelB || !slicedIds.includes(modelB)) return;

      try {
        const data = await fetchFileData(datasetMode, forgetClass, modelB);
        setModelBPoints(data.points);
      } catch (error) {
        console.error(`Error fetching model B file data: ${error}`);
        setModelBPoints([]);
      }
    }
    loadModelBData();
  }, [datasetMode, forgetClass, forgetClassExist, modelB]);

  return (
    <View
      width={CONFIG.CORE_WIDTH}
      height={CONFIG.CORE_HEIGHT}
      borderTop
      borderBottom
    >
      <div className="flex items-center gap-1 mb-1.5 ml-1 relative right-1">
        <Title
          title="Embedding"
          id={FIRST}
          className={cn(
            "relative z-10 cursor-pointer px-1",
            !isFirstMode && "text-gray-400 border-none"
          )}
          AdditionalContent={isFirstMode && <UnderLine />}
          onClick={handleDisplayModeChange}
        />
        <Title
          title="Attack Simulation"
          id={SECOND}
          className={cn(
            "relative z-10 cursor-pointer px-1",
            isFirstMode && "text-gray-400 border-none"
          )}
          AdditionalContent={!isFirstMode && <UnderLine />}
          onClick={handleDisplayModeChange}
        />
      </div>
      {forgetClassExist ? (
        isFirstMode ? (
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
