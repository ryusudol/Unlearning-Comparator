import { useState, useContext } from "react";

import LineChart from "../components/LineChart";
import DatasetModeSelector from "../components/DatasetModeSelector";
import { Layers02Icon } from "../components/UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ExperimentsContext } from "../store/experiments-context";
import { ForgetClassContext } from "../store/forget-class-context";

export default function Correlations({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { selectedForgetClasses } = useContext(ForgetClassContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const [dataset, setDataset] = useState("training");

  if (!baselineExperiment || !comparisonExperiment) return null;

  const allSelected = baseline !== "" && comparison !== "";

  return (
    <section
      style={{ height }}
      className="w-[510px] px-[5px] py-0.5 flex flex-col border-[1px] border-solid relative"
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <Layers02Icon />
          <h5 className="font-semibold ml-[3px] text-lg">
            Layer-Wise Correlations
          </h5>
        </div>
        {allSelected && <DatasetModeSelector onValueChange={setDataset} />}
      </div>
      {selectedForgetClasses.length > 0 ? (
        allSelected ? (
          <LineChart dataset={dataset} />
        ) : (
          <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
            Select both Baseline and Comparison.
          </div>
        )
      ) : (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first.
        </div>
      )}
    </section>
  );
}
