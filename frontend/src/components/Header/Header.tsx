import { useContext } from "react";

import ForgetClassTabs from "./ForgetClassSection";
import { LogoIcon, GithubIcon } from "../UI/icons";
import { DatasetContext } from "../../store/dataset-context";
import { NeuralNetworkModelContext } from "../../store/neural-network-model-context";

export default function Header() {
  const { dataset } = useContext(DatasetContext);
  const { neuralNetworkModel } = useContext(NeuralNetworkModelContext);

  const handleGithubIconClick = () => {
    window.open(
      "https://github.com/gnueaj/Machine-Unlearning-Comparator",
      "_blank"
    );
  };

  return (
    <div className="w-[1805px] text-white bg-black h-12 flex justify-between items-center px-4 relative">
      <div>
        <div className="flex items-center relative">
          <div className="flex items-center">
            <LogoIcon className="w-7 h-7" />
            <span className="text-2xl font-semibold ml-2 mr-10">
              UnlearningComparator
            </span>
          </div>
          <ForgetClassTabs />
        </div>
      </div>
      <GithubIcon
        onClick={handleGithubIconClick}
        className="w-7 h-7 cursor-pointer"
      />
      <div className="flex absolute left-[1312px] top-4 text-[13px]">
        <div className="flex flex-col mr-10">
          <span className="text-[10px] text-gray-300">Dataset</span>
          <span className="text-xs font-semibold -mt-[3px]">{dataset}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-300">Model</span>
          <span className="text-xs font-semibold -mt-[3px]">
            {neuralNetworkModel}
          </span>
        </div>
      </div>
    </div>
  );
}
