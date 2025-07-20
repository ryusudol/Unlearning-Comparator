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
import { useClasses } from "../../hooks/useClasses";

const FIRST = "first";
const SECOND = "second";

export default function Core() {
  const classes = useClasses();
  const datasetMode = useDatasetMode();

  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [displayMode, setDisplayMode] = useState(FIRST);
  const [modelAPoints, setModelAPoints] = useState<Point[]>([]);
  const [modelBPoints, setModelBPoints] = useState<Point[]>([]);

  const forgetClassExist = forgetClass !== -1;

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    setDisplayMode(e.currentTarget.id);
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
            displayMode !== FIRST && "text-gray-400 border-none"
          )}
          AdditionalContent={displayMode === FIRST && <UnderLine />}
          onClick={handleDisplayModeChange}
        />
        <Title
          title="Attack Simulation"
          id={SECOND}
          className={cn(
            "relative z-10 cursor-pointer px-1",
            displayMode !== SECOND && "text-gray-400 border-none"
          )}
          AdditionalContent={displayMode === SECOND && <UnderLine />}
          onClick={handleDisplayModeChange}
        />
        {datasetMode === "face" && (
          <Title
            title="Who is this?"
            id="face"
            className={cn(
              "relative z-10 cursor-pointer px-1",
              displayMode !== "face" && "text-gray-400 border-none"
            )}
            AdditionalContent={displayMode === "face" && <UnderLine />}
            onClick={handleDisplayModeChange}
          />
        )}
      </div>
      {forgetClassExist ? (
        displayMode === FIRST ? (
          <Embedding modelAPoints={modelAPoints} modelBPoints={modelBPoints} />
        ) : displayMode === SECOND ? (
          <PrivacyAttack
            modelAPoints={modelAPoints}
            modelBPoints={modelBPoints}
          />
        ) : (
          <section className="h-[760px] flex flex-col border rounded-md px-1.5 relative">
            <div className="m-auto flex flex-col items-center justify-center gap-2 relative bottom-5">
              <p className="text-3xl font-medium">{classes[forgetClass]}</p>
              <img
                src={`/representative_face_images/${forgetClass}.jpg`}
                alt={classes[forgetClass]}
                className="size-96 rounded-md shadow-md"
              />
            </div>
          </section>
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
