import * as d3 from "d3";

import { overviewData } from "../constants/basicData";
import DataTable from "../components/DataTable";
// import { OverviewContext } from "../store/overview-context";
import { AnalysisTextLinkIcon } from "../components/ui/icons";
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
  // const { overview, retrieveOverview } = useContext(OverviewContext);
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

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1110px] px-[5px] py-0.5 relative border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex items-center">
        <AnalysisTextLinkIcon />
        <h5 className="font-semibold ml-[3px] text-lg">Overview</h5>
      </div>
      <DataTable
        columns={columns}
        data={overviewData}
        performanceMetrics={performanceMetrics}
      />
    </section>
  );
}
