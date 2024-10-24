import * as d3 from "d3";

import { SettingsIcon } from "../components/ui/icons";
import { overviewData } from "../constants/basicData";
import DataTable from "../components/DataTable";
import { columns } from "../components/Columns";

const values = {
  unlearn_accuracy: overviewData.map((d) => d.unlearn_accuracy),
  remain_accuracy: overviewData.map((d) => d.remain_accuracy),
  test_unlearn_accuracy: overviewData.map((d) => d.test_unlearn_accuracy),
  test_remain_accuracy: overviewData.map((d) => d.test_remain_accuracy),
  RTE: overviewData.map((d) => d.RTE),
};

const baseColors = {
  unlearn_accuracy: "#D98585",
  test_unlearn_accuracy: "#D98585",
  RTE: "#D98585",
  remain_accuracy: "#429D4D",
  test_remain_accuracy: "#429D4D",
};

const mins = {
  unlearn_accuracy: d3.min(values.unlearn_accuracy)!,
  remain_accuracy: d3.min(values.remain_accuracy)!,
  test_unlearn_accuracy: d3.min(values.test_unlearn_accuracy)!,
  test_remain_accuracy: d3.min(values.test_remain_accuracy)!,
  RTE: d3.min(values.RTE)!,
};

const maxs = {
  unlearn_accuracy: d3.max(values.unlearn_accuracy)!,
  remain_accuracy: d3.max(values.remain_accuracy)!,
  test_unlearn_accuracy: d3.max(values.test_unlearn_accuracy)!,
  test_remain_accuracy: d3.max(values.test_remain_accuracy)!,
  RTE: d3.max(values.RTE)!,
};

const performanceMetrics = {
  unlearn_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.unlearn_accuracy, maxs.unlearn_accuracy])
      .range([0.2, 1]),
    baseColor: baseColors.unlearn_accuracy,
  },
  remain_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.remain_accuracy, maxs.remain_accuracy])
      .range([0.2, 1]),
    baseColor: baseColors.remain_accuracy,
  },
  test_unlearn_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.test_unlearn_accuracy, maxs.test_unlearn_accuracy])
      .range([0.2, 1]),
    baseColor: baseColors.test_unlearn_accuracy,
  },
  test_remain_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.test_remain_accuracy, maxs.test_remain_accuracy])
      .range([0.2, 1]),
    baseColor: baseColors.test_remain_accuracy,
  },
  RTE: {
    colorScale: d3.scaleLinear().domain([mins.RTE, maxs.RTE]).range([0.2, 1]),
    baseColor: baseColors.RTE,
  },
};

export default function PerformanceOverview({ height }: { height: number }) {
  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1210px] p-1 relative border-x-[1px] border-b-[1px]"
    >
      <div className="flex items-center ml-0.5 mb-[1px]">
        <SettingsIcon className="scale-110" />
        <h5 className="font-semibold ml-1 text-lg">Experiments</h5>
      </div>
      <DataTable
        columns={columns}
        data={overviewData}
        performanceMetrics={performanceMetrics}
      />
    </section>
  );
}
