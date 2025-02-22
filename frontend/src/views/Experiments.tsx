import { useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import DataTable from "../components/Experiments/DataTable";
import AddExperimentsButton from "../components/Experiments/AddExperimentsButton";
import { useForgetClassStore } from "../stores/forgetClassStore";
import { ArrowDownIcon, ArrowUpIcon } from "../components/UI/icons";
import { CONFIG } from "../app/App";

export default function Experiments() {
  const { forgetClass } = useForgetClassStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const forgetClassExist = forgetClass !== -1;

  const handleExpandClick = () => {
    setIsExpanded((prevState) => !prevState);
  };

  return (
    <View
      width={CONFIG.EXPERIMENTS_WIDTH}
      height={CONFIG.EXPERIMENTS_PROGRESS_HEIGHT}
      className="border-0 border-b overflow-visible"
    >
      <div className="flex justify-between items-center mb-[3px]">
        <div className="grid grid-flow-col grid-x-2 items-center">
          <Title title="Model Screening" customClass="right-[1px]" />
          <div
            className="w-5 h-5 flex justify-center items-center cursor-pointer ml-0 bg-white hover:bg-[#f8f9fb] transition"
            onClick={handleExpandClick}
          >
            {isExpanded ? (
              <ArrowUpIcon className="scale-[115%]" />
            ) : (
              <ArrowDownIcon className="scale-[115%]" />
            )}
          </div>
        </div>
        {forgetClassExist && <AddExperimentsButton />}
      </div>
      {forgetClassExist ? (
        <DataTable isExpanded={isExpanded} />
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
