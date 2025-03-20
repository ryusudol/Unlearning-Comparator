import { useMemo, useState } from "react";

import Subtitle from "../components/Subtitle";
import Indicator from "../components/Indicator";
import VerticalBarChart from "../components/Accuracy/VerticalBarChart";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { getAccuracyGap, getMaxGap } from "../utils/data/accuracies";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../stores/experimentsStore";

export default function ClassWiseAnalysis() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  const accuracyData = useMemo(() => {
    const trainAccuracyGap = getAccuracyGap(
      modelAExperiment?.accs,
      modelBExperiment?.accs
    );
    const testAccuracyGap = getAccuracyGap(
      modelAExperiment?.t_accs,
      modelBExperiment?.t_accs
    );
    const trainMaxGap = getMaxGap(trainAccuracyGap);
    const testMaxGap = getMaxGap(testAccuracyGap);
    const maxGap = Math.max(trainMaxGap, testMaxGap);

    return {
      trainAccuracyGap,
      testAccuracyGap,
      maxGap,
    };
  }, [modelAExperiment, modelBExperiment]);

  return (
    <div className="h-[306.5px]">
      <Subtitle title="Class-wise Accuracy" className="left-0.5" />
      {forgetClass !== undefined ? (
        modelA !== "" && modelB !== "" ? (
          <div className="flex items-center relative left-2">
            <VerticalBarChart
              mode="Training"
              gapData={accuracyData.trainAccuracyGap}
              maxGap={accuracyData.maxGap}
              hoveredClass={hoveredClass}
              onHoverChange={setHoveredClass}
            />
            <VerticalBarChart
              mode="Test"
              gapData={accuracyData.testAccuracyGap}
              maxGap={accuracyData.maxGap}
              hoveredClass={hoveredClass}
              onHoverChange={setHoveredClass}
              showYAxis={false}
            />
          </div>
        ) : (
          <Indicator about="AB" />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </div>
  );
}
