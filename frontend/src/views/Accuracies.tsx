import { useMemo, useContext, useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import VerticalBarChart from "../components/Accuracies/VerticalBarChart";
import { useForgetClass } from "../hooks/useForgetClass";
import { useModelSelection } from "../hooks/useModelSelection";
import { ViewProps } from "../types/common";
import { ExperimentsContext } from "../store/experiments-context";
import { getAccuracyGap, getMaxGap } from "../utils/data/accuracies";

export default function Accuracy({ width, height }: ViewProps) {
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
    <View width={width} height={height} className="border-t-0">
      <Title
        title="Accuracy Comparison"
        customClass="bottom-[2px] right-[1px]"
      />
      {forgetClassExist ? (
        areAllModelsSelected ? (
          <div className="w-full flex items-center relative bottom-0.5">
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
    </View>
  );
}
