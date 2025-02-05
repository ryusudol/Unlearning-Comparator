import { useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import DataTable from "../components/Experiments/DataTable";
import AddExperimentsButton from "../components/Experiments/AddExperimentsButton";
import { useForgetClass } from "../hooks/useForgetClass";
import { ViewProps } from "../types/common";
import {
  SettingsIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from "../components/UI/icons";

export default function Experiments({ width, height }: ViewProps) {
  const { forgetClassExist } = useForgetClass();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = () => {
    setIsExpanded((prevState) => !prevState);
  };

  return (
    <View
      width={width}
      height={height}
      className="border-t-0 border-l-0 overflow-visible"
    >
      <div className="flex justify-between items-center mb-[3px]">
        <div className="grid grid-flow-col grid-x-2 items-center">
          <Title
            Icon={<SettingsIcon />}
            title="Experiments"
            customClass="right-[1px]"
          />
          <div
            className="w-5 h-5 flex justify-center items-center cursor-pointer ml-0 bg-white hover:bg-[#f8f9fb] transition"
            onClick={handleExpandClick}
          >
            {isExpanded ? (
              <ArrowDownIcon className="scale-[115%]" />
            ) : (
              <ArrowRightIcon className="scale-[115%]" />
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
