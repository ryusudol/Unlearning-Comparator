import { useContext } from "react";

import DataTable from "../components/DataTable";
import { columns } from "../components/Columns";
import { SettingsIcon } from "../components/UI/icons";
import { overviewData } from "../constants/basicData";
import { ForgetClassContext } from "../store/forget-class-context";
import { performanceMetrics } from "../constants/overview";

export default function PerformanceOverview({ height }: { height: number }) {
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1210px] p-1 relative border-x-[1px] border-b-[1px]"
    >
      <div className="flex items-center ml-0.5 mb-[1px]">
        <SettingsIcon className="scale-110" />
        <h5 className="font-semibold ml-1 text-lg">Experiments</h5>
      </div>
      {selectedForgetClasses.length === 0 ? (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first from above.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={overviewData}
          performanceMetrics={performanceMetrics}
        />
      )}
    </section>
  );
}
