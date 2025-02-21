import { useMemo, useContext, useState } from "react";

import Subtitle from "../components/Subtitle";
import Indicator from "../components/Indicator";
import VerticalBarChart from "../components/Accuracies/VerticalBarChart";
import { useForgetClass } from "../hooks/useForgetClass";
import { useModelSelection } from "../hooks/useModelSelection";
import { ExperimentsContext } from "../stores/experiments-context";
import { getAccuracyGap, getMaxGap } from "../utils/data/accuracies";

export default function ClassWiseAnalysis() {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const { areAllModelsSelected } = useModelSelection();
  const { forgetClassExist } = useForgetClass();

  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  const accuracyData = useMemo(() => {
    const trainAccuracyGap = getAccuracyGap(
      baselineExperiment?.accs,
      comparisonExperiment?.accs
    );
    const testAccuracyGap = getAccuracyGap(
      baselineExperiment?.t_accs,
      comparisonExperiment?.t_accs
    );
    const trainMaxGap = getMaxGap(trainAccuracyGap);
    const testMaxGap = getMaxGap(testAccuracyGap);
    const maxGap = Math.max(trainMaxGap, testMaxGap);

    return {
      trainAccuracyGap,
      testAccuracyGap,
      maxGap,
    };
  }, [baselineExperiment, comparisonExperiment]);

  return (
    <div className="mb-2">
      <Subtitle title="Class-wise Accuracy" />
      {forgetClassExist ? (
        areAllModelsSelected ? (
          <div className="flex items-center py-1 relative border rounded-md">
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
