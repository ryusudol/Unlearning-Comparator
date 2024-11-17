import { useMemo, useContext } from "react";

import VerticalBarChart from "../components/VerticalBarChart";
import { TABLEAU10 } from "../constants/tableau10";
import { Chart01Icon } from "../components/UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ExperimentsContext } from "../store/experiments-context";

const GAP_FIX_LENGTH = 3;

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

  const baselineTrainAccuracies: number[] | undefined =
    baselineExperiment?.accs;
  const comparisonTrainAccuracies: number[] | undefined =
    comparisonExperiment?.accs;
  const baselineTestAccuracies: number[] | undefined =
    baselineExperiment?.t_accs;
  const comparisonTestAccuracies: number[] | undefined =
    comparisonExperiment?.t_accs;

  const trainAccuracyGap = useMemo(
    () =>
      baselineTrainAccuracies && comparisonTrainAccuracies
        ? Object.keys(baselineTrainAccuracies).map((key, idx) => {
            const baselineValue = baselineTrainAccuracies[idx];
            const comparisonValue = comparisonTrainAccuracies[idx];
            const categoryLetter = String.fromCharCode(65 + idx);
            return {
              category: categoryLetter,
              classLabel: key,
              gap: parseFloat(
                (comparisonValue - baselineValue).toFixed(GAP_FIX_LENGTH)
              ),
              fill: TABLEAU10[idx],
              baselineAccuracy: baselineValue,
              comparisonAccuracy: comparisonValue,
            };
          })
        : [],
    [baselineTrainAccuracies, comparisonTrainAccuracies]
  );

  const testAccuracyGap = useMemo(
    () =>
      baselineTestAccuracies && comparisonTestAccuracies
        ? Object.keys(baselineTestAccuracies).map((key, idx) => {
            const baselineValue = baselineTestAccuracies[idx];
            const comparisonValue = comparisonTestAccuracies[idx];
            const categoryLetter = String.fromCharCode(65 + idx);
            return {
              category: categoryLetter,
              classLabel: key,
              gap: parseFloat(
                (comparisonValue - baselineValue).toFixed(GAP_FIX_LENGTH)
              ),
              fill: TABLEAU10[idx],
              baselineAccuracy: baselineValue,
              comparisonAccuracy: comparisonValue,
            };
          })
        : [],
    [baselineTestAccuracies, comparisonTestAccuracies]
  );

  const trainMaxGap = getMaxGap(trainAccuracyGap);
  const testMaxGap = getMaxGap(testAccuracyGap);
  const maxGap = Math.max(trainMaxGap, testMaxGap);

  return (
    <section
      style={{ height: height }}
      className="w-[440px] p-1 flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] relative"
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
        <div className="w-full flex justify-center items-center -mt-0.5">
          <VerticalBarChart
            mode="Training"
            gapData={trainAccuracyGap}
            maxGap={maxGap}
          />
          <VerticalBarChart
            mode="Test"
            gapData={testAccuracyGap}
            maxGap={maxGap}
            showYAxis={false}
          />
        </div>
      )}
    </section>
  );
}
