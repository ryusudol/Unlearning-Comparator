import { useContext } from "react";

import { BaselineComparisonContext } from "../stores/baseline-comparison-context";

export const useModelSelection = () => {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const areAllModelsSelected = baseline !== "" && comparison !== "";

  return { baseline, comparison, areAllModelsSelected };
};
