import { TABLEAU10 } from "../../constants/colors";
import { GapDataItem } from "../../types/accuracies";

const GAP_FIX_LENGTH = 3;

export function getAccuracyGap(
  baseAcc: number[] | undefined,
  compAcc: number[] | undefined
) {
  return baseAcc && compAcc
    ? Object.keys(baseAcc).map((key, idx) => {
        const baselineValue = baseAcc[idx];
        const comparisonValue = compAcc[idx];
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
    : [];
}

export function getMaxGap(gapData: GapDataItem[]) {
  return Number(
    Math.max(...gapData.map((item) => Math.abs(item.gap))).toFixed(3)
  );
}
