import { TABLEAU10 } from "../../constants/colors";
import { GapDataItem } from "../../types/data";

const GAP_FIX_LENGTH = 3;

export function getAccuracyGap(
  baseAcc: number[] | undefined,
  compAcc: number[] | undefined
) {
  return baseAcc && compAcc
    ? Object.keys(baseAcc).map((key, idx) => {
        const modelAValue = baseAcc[idx];
        const modelBValue = compAcc[idx];
        const categoryLetter = String.fromCharCode(65 + idx);
        return {
          category: categoryLetter,
          classLabel: key,
          gap: parseFloat((modelBValue - modelAValue).toFixed(GAP_FIX_LENGTH)),
          fill: TABLEAU10[idx],
          modelAAccuracy: modelAValue,
          modelBAccuracy: modelBValue,
        };
      })
    : [];
}

export function getMaxGap(gapData: GapDataItem[]) {
  return Number(
    Math.max(...gapData.map((item) => Math.abs(item.gap))).toFixed(3)
  );
}
