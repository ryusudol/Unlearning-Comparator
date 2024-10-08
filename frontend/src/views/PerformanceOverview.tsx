import * as d3 from "d3";

import { overviewData } from "../constants/basicData";
import DataTable from "../components/DataTable";
// import { OverviewContext } from "../store/overview-context";
// import { BaselineContext } from "../store/baseline-context";
import { AnalysisTextLinkIcon } from "../components/ui/icons";
import { colors, columns } from "../components/Columns";

const values = {
  ua: overviewData.map((d) => d.ua),
  ra: overviewData.map((d) => d.ra),
  tua: overviewData.map((d) => d.tua),
  tra: overviewData.map((d) => d.tra),
  rte: overviewData.map((d) => d.rte),
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
  // const { overview, retrieveOverview } = useContext(OverviewContext);
  // const { baseline } = useContext(BaselineContext);
  // const { selectedID, saveSelectedID } = useContext(SelectedIDContext);

  // useEffect(() => {
  //   // retrieveOverview();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // const filteredOverview = overview.filter(
  //   (el) => el.forget_class === baseline.toString()
  // );

  // const currRetrainedData = retrainedData[baseline];
  // const retrainedUA = currRetrainedData.unlearn_accuracy;
  // const retrainedRA = currRetrainedData.remain_accuracy;
  // const retrainedTA = currRetrainedData.test_accuracy;

  const colorScale = d3
    .scaleSequential<string>(
      d3.interpolateRgbBasis(["#F2AAA8", "#FFFFFF", "#A6A6F9"])
    )
    .domain([1, 0]);

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1110px] p-[5px] relative border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center">
          <AnalysisTextLinkIcon />
          <h5 className="font-semibold ml-[3px]">Overview</h5>
        </div>
        {/* Legend */}
        <div className="flex flex-col items-start absolute right-[6px] top-2">
          <div className="text-[11px]">Performance</div>
          <div className="w-[250px] h-5 relative">
            <div
              className="w-full h-[10px]"
              style={{
                background: `linear-gradient(to right, ${colorScale(
                  0
                )}, ${colorScale(0.5)}, ${colorScale(1)})`,
              }}
            ></div>
            <div className="flex justify-between w-full text-[11px] mt-[2px]">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={overviewData}
        performanceMetrics={performanceMetrics}
      />
    </section>
  );
}
