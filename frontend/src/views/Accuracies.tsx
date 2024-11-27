import { useMemo, useContext, useState } from "react";

import VerticalBarChart from "../components/VerticalBarChart";
import { Chart01Icon } from "../components/UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ExperimentsContext } from "../store/experiments-context";
import { getAccuracyGap } from "../utils/data/getAccuracyGap";

export interface GapDataItem {
  category: string;
  classLabel: string;
  gap: number;
  fill: string;
  baselineAccuracy: number;
  comparisonAccuracy: number;
}

function getMaxGap(gapData: GapDataItem[]) {
  return Number(
    Math.max(...gapData.map((item) => Math.abs(item.gap))).toFixed(3)
  );
}

export default function Accuracies({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

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
    <section
      style={{ height }}
      className="w-[510px] p-1 flex flex-col border border-t-0 relative"
    >
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-1 text-lg">
          Accuracies
          <span className="ml-1">(Comparison - Baseline)</span>
        </h5>
      </div>
      {baseline === "" || comparison === "" ? (
        <p className="h-full flex justify-center items-center text-[15px] text-gray-500">
          Select both Baseline and Comparison.
        </p>
      ) : (
        <div className="w-full flex items-center relative ml-0.5">
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
      )}
    </section>
  );
}
