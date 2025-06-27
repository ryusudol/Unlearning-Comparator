import { useState, useEffect } from "react";

import Indicator from "../../components/common/Indicator";
import Legend from "../../components/Core/PrivacyAttack/Legend";
import AttackAnalytics from "../../components/Core/PrivacyAttack/AttackAnalytics";
import { Prob } from "../../types/embeddings";
import { Separator } from "../../components/UI/separator";
import { useModelDataStore } from "../../stores/modelDataStore";
import { fetchFileData } from "../../utils/api/common";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useAttackStateStore } from "../../stores/attackStore";
import { ExperimentData } from "../../types/data";
import { ENTROPY, UNLEARN } from "../../constants/common";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";
import { useDatasetMode } from "../../hooks/useDatasetMode";

interface Props {
  modelAPoints: (number | Prob)[][];
  modelBPoints: (number | Prob)[][];
}

export default function PrivacyAttack({ modelAPoints, modelBPoints }: Props) {
  const datasetMode = useDatasetMode();

  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const setMetric = useAttackStateStore((state) => state.setMetric);
  const setDirection = useAttackStateStore((state) => state.setDirection);
  const setStrategy = useAttackStateStore((state) => state.setStrategy);

  const [retrainData, setRetrainData] = useState<ExperimentData>();

  const isModelAOriginal = modelA.startsWith("000");
  const isModelBOriginal = modelB.startsWith("000");

  useEffect(() => {
    setMetric(ENTROPY);
    setDirection(UNLEARN);
    setStrategy(THRESHOLD_STRATEGIES[0].strategy);
  }, [setDirection, setMetric, setStrategy]);

  useEffect(() => {
    async function loadRetrainData() {
      if (forgetClass === -1) return;
      try {
        const data = await fetchFileData(
          datasetMode,
          forgetClass,
          `a00${forgetClass}`
        );
        setRetrainData(data);
      } catch (error) {
        console.error(`Failed to fetch an retrained data file: ${error}`);
      }
    }
    loadRetrainData();
  }, [datasetMode, forgetClass]);

  const FetchFailedIndicator = (
    <Indicator text="Failed to fetch retrain data" />
  );
  const UnselectedModelIndicator = (
    <Indicator text="Please select an unlearned model to compare the attack results" />
  );
  const contentA = !retrainData ? (
    FetchFailedIndicator
  ) : isModelAOriginal ? (
    UnselectedModelIndicator
  ) : (
    <AttackAnalytics
      mode="A"
      retrainPoints={retrainData.points}
      modelPoints={modelAPoints}
      retrainAttackData={retrainData.attack}
    />
  );
  const contentB = !retrainData ? (
    FetchFailedIndicator
  ) : isModelBOriginal ? (
    UnselectedModelIndicator
  ) : (
    <AttackAnalytics
      mode="B"
      retrainPoints={retrainData.points}
      modelPoints={modelBPoints}
      retrainAttackData={retrainData.attack}
    />
  );

  return (
    <div className="h-[760px] flex flex-col border rounded-md px-1.5">
      <Legend />
      <div className="flex items-center">
        {contentA}
        <Separator
          orientation="vertical"
          className="h-[630px] w-[1px] mx-1 relative top-3.5"
        />
        {contentB}
      </div>
    </div>
  );
}
