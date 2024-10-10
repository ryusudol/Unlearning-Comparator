import { useContext } from "react";

import BarChart from "../components/BarChart";
import { TABLEAU10 } from "../constants/tableau10";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { basicData } from "../constants/basicData";
import { Chart01Icon } from "../components/ui/icons";
import { ForgetClassContext } from "../store/forget-class-context";
import { forgetClassNames } from "../constants/forgetClassNames";

interface ClassAccuracies {
  "0": string;
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
  "6": string;
  "7": string;
  "8": string;
  "9": string;
}

export default function Accuracies({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClass } = useContext(ForgetClassContext);

  const baselineData = basicData.filter((datum) => datum.id === baseline)[0];
  const comparisonData = basicData.filter(
    (datum) => datum.id === comparison
  )[0];

  const baselineTrainAccuracies: ClassAccuracies =
    baselineData?.train_class_accuracies;
  const comparisonTrainAccuracies: ClassAccuracies =
    comparisonData?.train_class_accuracies;
  const baselineTestAccuracies: ClassAccuracies =
    baselineData?.test_class_accuracies;
  const comparisonTestAccuracies: ClassAccuracies =
    comparisonData?.test_class_accuracies;

  const trainAccuracyGap =
    baselineTrainAccuracies && comparisonTrainAccuracies
      ? Object.keys(baselineTrainAccuracies).map((key, idx) => {
          const baselineValue = parseFloat(
            baselineTrainAccuracies[key as keyof ClassAccuracies]
          );
          const comparisonValue = parseFloat(
            comparisonTrainAccuracies[key as keyof ClassAccuracies]
          );
          const categoryLetter = String.fromCharCode(65 + idx);
          return {
            category: categoryLetter,
            classLabel: key,
            gap: parseFloat((comparisonValue - baselineValue).toFixed(2)),
            fill: TABLEAU10[idx],
            baselineAccuracy: baselineValue,
            comparisonAccuracy: comparisonValue,
          };
        })
      : [];

  const testAccuracyGap =
    baselineTestAccuracies && comparisonTestAccuracies
      ? Object.keys(baselineTestAccuracies).map((key, idx) => {
          const baselineValue = parseFloat(
            baselineTestAccuracies[key as keyof ClassAccuracies]
          );
          const comparisonValue = parseFloat(
            comparisonTestAccuracies[key as keyof ClassAccuracies]
          );
          const categoryLetter = String.fromCharCode(65 + idx);
          return {
            category: categoryLetter,
            classLabel: key,
            gap: parseFloat((comparisonValue - baselineValue).toFixed(2)),
            fill: TABLEAU10[idx],
            baselineAccuracy: baselineValue,
            comparisonAccuracy: comparisonValue,
          };
        })
      : [];

  return (
    <section
      style={{ height: height }}
      className="w-[480px] p-[5px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] relative"
    >
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-[3px]">Accuracies</h5>
      </div>
      {baseline === "" || comparison === "" ? (
        <p className="h-full flex justify-center items-center text-[15px] text-gray-500">
          Select both Baseline and Comparison from the left.
        </p>
      ) : (
        <div className="w-full flex justify-center items-center">
          {/* justify-start */}
          {/* <div className="flex justify-center items-center"> */}
          {/* <p className="w-10 -rotate-90 origin-left translate-x-7 translate-y-[26px] text-[13px] text-[#808080]">
            Classes
          </p> */}
          <BarChart mode="Training" gapData={trainAccuracyGap} />
          <BarChart mode="Test" gapData={testAccuracyGap} />
          {/* </div> */}
        </div>
      )}
      {forgetClass && (
        <p className="text-xs font-medium absolute top-2 right-4">
          * X is{" "}
          <span
            style={{ color: TABLEAU10[forgetClassNames.indexOf(forgetClass)] }}
          >
            {forgetClass}
          </span>
        </p>
      )}
    </section>
  );
}
