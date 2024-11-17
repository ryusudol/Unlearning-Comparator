import { useState, useContext } from "react";

import Heatmap from "../components/Heatmap";
import HeatmapLegend from "../components/HeatmapLegend";
import LineChart from "../components/LineChart";
import DatasetModeSelector from "../components/DatasetModeSelector";
import { Layers02Icon } from "../components/UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ExperimentsContext } from "../store/experiments-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { extractHeatmapData } from "../utils/data/experiments";

export default function Correlations({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { selectedForgetClasses } = useContext(ForgetClassContext);
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const [dataset, setDataset] = useState("training");

  if (!baselineExperiment || !comparisonExperiment) return null;

  const allSelected = baseline !== "" && comparison !== "";

  const baselineData = extractHeatmapData(dataset, baselineExperiment);
  const comparisonData = extractHeatmapData(dataset, comparisonExperiment);
  const layers = baselineExperiment.cka.layers;

  return (
    <section
      style={{ height }}
      className="w-[440px] px-[5px] mt-[260px] py-0.5 flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] relative"
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
          <div className="flex flex-col items-center">
            <LineChart dataset={dataset} />
            <div className="flex items-center relative left-1.5">
              <Heatmap mode="Baseline" data={baselineData} layers={layers} />
              <Heatmap
                mode="Comparison"
                data={comparisonData}
                layers={layers}
              />
              <HeatmapLegend />
            </div>
          </div>
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
