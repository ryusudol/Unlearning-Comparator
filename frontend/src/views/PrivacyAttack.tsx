import React, { useState, useEffect } from "react";

import Indicator from "../components/Indicator";
import AttackLegend from "../components/PrivacyAttack/AttackLegend";
import AttackAnalytics from "../components/PrivacyAttack/AttackAnalytics";
import { Prob } from "../types/embeddings";
import { Separator } from "../components/UI/separator";
import { useModelDataStore } from "../stores/modelDataStore";
import { THRESHOLD_STRATEGIES } from "../constants/privacyAttack";
import { fetchFileData } from "../utils/api/unlearning";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { ExperimentData } from "../types/data";

export const ENTROPY = "entropy";
export const CONFIDENCE = "confidence";
export const UNLEARN = "unlearn";
export const RETRAIN = "retrain";

export type Metric = "entropy" | "confidence";

interface Props {
  modelAPoints: (number | Prob)[][];
  modelBPoints: (number | Prob)[][];
}

export default function PrivacyAttack({ modelAPoints, modelBPoints }: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);

  const [metric, setMetric] = useState<Metric>(ENTROPY);
  const [direction, setDirection] = useState(UNLEARN);
  const [strategy, setStrategy] = useState(THRESHOLD_STRATEGIES[0].strategy);
  const [retrainData, setRetrainData] = useState<ExperimentData>();

  const isModelAOriginal = modelA.startsWith("000");
  const isModelBOriginal = modelB.startsWith("000");

  useEffect(() => {
    async function loadRetrainData() {
      if (forgetClass === -1) return;
      try {
        const data = await fetchFileData(forgetClass, `a00${forgetClass}`);
        setRetrainData(data);
      } catch (error) {
        console.error(`Failed to fetch an retrained data file: ${error}`);
      }
    }
    loadRetrainData();
  }, [forgetClass]);

  const handleMetricChange = (metric: Metric) => {
    setMetric(metric);
  };

  const handleDirectionChange = (direction: string) => {
    setDirection(direction);
  };

  const handleStrategyChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    const currStrategy = e.currentTarget.innerHTML;
    if (strategy !== currStrategy) {
      setStrategy(currStrategy);
    }
  };

  return (
    <div className="h-[764px] flex flex-col border rounded-md px-1.5">
      <AttackLegend
        metric={metric}
        direction={direction}
        strategy={strategy}
        onUpdateMetric={handleMetricChange}
        onUpdateDirection={handleDirectionChange}
        onUpdateStrategy={handleStrategyChange}
      />
      <div className="flex items-center">
        {!retrainData ? (
          <Indicator text="Failed to fetch retrain data" />
        ) : isModelAOriginal ? (
          <Indicator text="Please select an unlearned model to compare the attack results" />
        ) : (
          <AttackAnalytics
            mode="A"
            metric={metric}
            direction={direction}
            strategy={strategy}
            retrainPoints={retrainData.points}
            modelPoints={modelAPoints}
            retrainAttackData={retrainData.attack}
            onUpdateMetric={handleMetricChange}
            onUpdateDirection={handleDirectionChange}
            onUpdateStrategy={handleStrategyChange}
          />
        )}
        <Separator
          orientation="vertical"
          className="h-[635px] w-[1px] mx-1 relative top-3"
        />
        {!retrainData ? (
          <Indicator text="Failed to fetch retrain data" />
        ) : isModelBOriginal ? (
          <Indicator text="Please select an unlearned model to compare the attack results" />
        ) : (
          <AttackAnalytics
            mode="B"
            metric={metric}
            direction={direction}
            strategy={strategy}
            retrainPoints={retrainData.points}
            modelPoints={modelBPoints}
            retrainAttackData={retrainData.attack}
            onUpdateMetric={handleMetricChange}
            onUpdateDirection={handleDirectionChange}
            onUpdateStrategy={handleStrategyChange}
          />
        )}
      </div>
    </div>
  );
}
