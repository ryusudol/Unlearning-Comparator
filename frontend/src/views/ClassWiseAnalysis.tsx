import { useMemo, useState } from "react";

import Subtitle from "../components/Subtitle";
import Indicator from "../components/Indicator";
import VerticalBarChart from "../components/Accuracies/VerticalBarChart";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../stores/experimentsStore";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { useModelDataStore } from "../stores/modelDataStore";
import { getAccuracyGap, getMaxGap } from "../utils/data/accuracies";

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
    <div>
      <Subtitle title="Class-wise Accuracy" />
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
              showYAxis={false}
              hoveredClass={hoveredClass}
              onHoverChange={setHoveredClass}
            />
          </div>
        ) : (
          <Indicator about="BaselineComparison" />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </div>
  );
}
