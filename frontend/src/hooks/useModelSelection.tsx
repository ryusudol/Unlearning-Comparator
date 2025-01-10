import { useContext } from "react";

import { BaselineComparisonContext } from "../store/baseline-comparison-context";

export const useModelSelection = () => {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const areAllModelsSelected = baseline !== "" && comparison !== "";

  return { baseline, comparison, areAllModelsSelected };
};
