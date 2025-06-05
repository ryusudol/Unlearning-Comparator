import { useState } from "react";

import View from "../../components/common/View";
import Title from "../../components/common/Title";
import Indicator from "../../components/common/Indicator";
import DataTable from "../../components/ModelScreening/Experiments/DataTable";
import Legend from "../../components/ModelScreening/Experiments/Legend";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { ArrowDownIcon, ArrowUpIcon } from "../../components/UI/icons";
import { CONFIG } from "../../app/App";

export default function Experiments() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);

  const [isExpanded, setIsExpanded] = useState(false);

  const forgetClassExist = forgetClass !== -1;

  const handleExpandClick = () => {
    setIsExpanded((prevState) => !prevState);
  };

  return (
    <View
      width={CONFIG.EXPERIMENTS_WIDTH}
      height={CONFIG.EXPERIMENTS_PROGRESS_HEIGHT}
      className="overflow-visible"
    >
      <div className="flex justify-between items-center mb-[3px]">
        <div className="grid grid-flow-col grid-x-2 items-center">
          <Title title="Model Screening" className="left-0.5" />
          <div
            className="w-5 h-5 flex justify-center items-center cursor-pointer bg-white hover:bg-[#f8f9fb] transition ml-1"
            onClick={handleExpandClick}
          >
            {isExpanded ? (
              <ArrowUpIcon className="scale-[115%]" />
            ) : (
              <ArrowDownIcon className="scale-[115%]" />
            )}
          </div>
        </div>
        {forgetClassExist && <Legend />}
      </div>
      {forgetClassExist ? (
        <DataTable isExpanded={isExpanded} />
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
