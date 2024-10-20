import * as d3 from "d3";

import { overviewData } from "../constants/basicData";
import DataTable from "../components/DataTable";
import { colors, columns } from "../components/Columns";

const values = {
  ua: overviewData.map((d) => d.unlearn_accuracy),
  ra: overviewData.map((d) => d.remain_accuracy),
  tua: overviewData.map((d) => d.test_unlearn_accuracy),
  tra: overviewData.map((d) => d.test_remain_accuracy),
  rte: overviewData.map((d) => d.RTE),
};
const performanceMetrics = {
  ua: {
    colorScale: d3.scaleQuantile<string>().domain(values.ua).range(colors),
  },
  ra: {
    colorScale: d3.scaleQuantile<string>().domain(values.ra).range(colors),
  },
  tua: {
    colorScale: d3.scaleQuantile<string>().domain(values.tua).range(colors),
  },
  tra: {
    colorScale: d3.scaleQuantile<string>().domain(values.tra).range(colors),
  },
  rte: {
    colorScale:
      typeof values.rte === "number" &&
      d3.scaleQuantile<string>().domain(values.rte).range(colors),
  },
};

export default function PerformanceOverview({ height }: { height: number }) {
  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1210px] p-1 relative border-l-[1px] border-r-[1px] border-b-[1px] border-[rgba(0, 0, 0, 0.2)]"
    >
      <DataTable
        columns={columns}
        data={overviewData}
        performanceMetrics={performanceMetrics}
      />
    </section>
  );
}
