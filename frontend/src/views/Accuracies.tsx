import { useMemo, useContext, useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import VerticalBarChart from "../components/Accuracies/VerticalBarChart";
import { useForgetClass } from "../hooks/useForgetClass";
import { useModelSelection } from "../hooks/useModelSelection";
import { ViewProps } from "../types/common";
import { Chart01Icon } from "../components/UI/icons";
import { ExperimentsContext } from "../store/experiments-context";
import { getAccuracyGap, getMaxGap } from "../utils/data/accuracies";

export default function Accuracies({ width, height }: ViewProps) {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const { areAllModelsSelected } = useModelSelection();
  const { forgetClassExist } = useForgetClass();
  console.log("re-rendered!");

  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  const trainAccuracyGap = useMemo(
    () => getAccuracyGap(baselineExperiment?.accs, comparisonExperiment?.accs),
    [baselineExperiment?.accs, comparisonExperiment?.accs]
  );
  const testAccuracyGap = useMemo(
    () =>
      getAccuracyGap(baselineExperiment?.t_accs, comparisonExperiment?.t_accs),
    [baselineExperiment?.t_accs, comparisonExperiment?.t_accs]
  );

  const trainMaxGap = getMaxGap(trainAccuracyGap);
  const testMaxGap = getMaxGap(testAccuracyGap);

  const maxGap = Math.max(trainMaxGap, testMaxGap);

  return (
    <View width={width} height={height} className="border-t-0">
      <Title
        Icon={<Chart01Icon />}
        title="Accuracies"
        customClass="bottom-[2px] right-[1px]"
        AdditionalContent={
          <span className="ml-1">(Comparison - Baseline)</span>
        }
      />
      {forgetClassExist ? (
        areAllModelsSelected ? (
          <div className="w-full flex items-center relative bottom-0.5">
            <VerticalBarChart
              mode="Training"
              gapData={trainAccuracyGap}
              maxGap={maxGap}
              hoveredClass={hoveredClass}
              setHoveredClass={setHoveredClass}
            />
            <VerticalBarChart
              mode="Test"
              gapData={testAccuracyGap}
              maxGap={maxGap}
              showYAxis={false}
              hoveredClass={hoveredClass}
              setHoveredClass={setHoveredClass}
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
