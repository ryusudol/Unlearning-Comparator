import { useContext } from "react";

import BarChart from "../components/BarChart";
import { TABLEAU10 } from "../constants/tableau10";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { basicData } from "../constants/basicData";
import { Chart01Icon } from "../components/ui/icons";

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

export default function PerformanceMetrics({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const baselineTrainAccuracies: ClassAccuracies =
    basicData[+baseline].train_class_accuracies;
  const comparisonTrainAccuracies: ClassAccuracies =
    basicData[+comparison].train_class_accuracies;
  const baselineTestAccuracies: ClassAccuracies =
    basicData[+baseline].test_class_accuracies;
  const comparisonTestAccuracies: ClassAccuracies =
    basicData[+comparison].test_class_accuracies;

  const trainAccuracyGap = Object.keys(baselineTrainAccuracies).map(
    (key, idx) => {
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
        value: parseFloat((comparisonValue - baselineValue).toFixed(2)),
        fill: TABLEAU10[idx],
        baselineAccuracy: baselineValue,
        comparisonAccuracy: comparisonValue,
      };
    }
  );

  const testAccuracyGap = Object.keys(baselineTestAccuracies).map(
    (key, idx) => {
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
        value: parseFloat((comparisonValue - baselineValue).toFixed(2)),
        fill: TABLEAU10[idx],
        baselineAccuracy: baselineValue,
        comparisonAccuracy: comparisonValue,
      };
    }
  );

  return (
    <section
      style={{ height: height }}
      className="w-[480px] p-[5px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-[3px]">Accuracies</h5>
      </div>
      <div className="w-full flex flex-col justify-start items-center">
        <div className="flex justify-center items-center mt-[6px] -ml-6">
          <p className="w-10 -rotate-90 origin-left translate-x-7 translate-y-[26px] text-[13px] text-[#808080]">
            Classes
          </p>
          <BarChart mode="Training" gapData={trainAccuracyGap} />
          <BarChart mode="Test" gapData={testAccuracyGap} />
        </div>
      </div>
    </section>
  );
}
