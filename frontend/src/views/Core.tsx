import React, { useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import Embeddings from "./Embeddings";
import PrivacyAttack from "./PrivacyAttack";
import { ChartScatterIcon, UserQuestionIcon } from "../components/UI/icons";
import { useForgetClass } from "../hooks/useForgetClass";
import { ViewProps } from "../types/common";

const EMBEDDINGS = "embeddings";
const ATTACK = "attack";
const HEIGHT = 635;

export default function Core({ width, height }: ViewProps) {
  const { forgetClassExist } = useForgetClass();

  const [displayMode, setDisplayMode] = useState(EMBEDDINGS);

  const isEmbeddingMode = displayMode === EMBEDDINGS;

  const handleDisplayModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;

    if (id === EMBEDDINGS) {
      setDisplayMode(EMBEDDINGS);
    } else {
      setDisplayMode(ATTACK);
    }
  };

  let content = <Indicator about="ForgetClass" />;
  if (forgetClassExist) {
    if (isEmbeddingMode) {
      content = <Embeddings height={HEIGHT} />;
    } else {
      content = <PrivacyAttack height={HEIGHT} />;
    }
  }

  return (
    <View width={width} height={height} className="border-l-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 mb-0.5 relative right-1">
          <Title
            Icon={
              <ChartScatterIcon
                className={!isEmbeddingMode ? "opacity-40" : ""}
              />
            }
            title="Embeddings"
            id={EMBEDDINGS}
            customClass={`relative z-10 cursor-pointer pb-0.5 px-1 ${
              !isEmbeddingMode && "text-gray-400 border-none"
            }`}
            AdditionalContent={isEmbeddingMode && <UnderLine />}
            onClick={handleDisplayModeChange}
          />
          <Title
            Icon={
              <UserQuestionIcon
                className={`w-4 h-4 ${isEmbeddingMode && "opacity-40"}`}
              />
            }
            title="Membership Inference Attack"
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
