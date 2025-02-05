import { useContext } from "react";

import ForgetClassTabs from "./ForgetClassTabs";
import { GithubIcon } from "../UI/icons";
import { DatasetContext } from "../../store/dataset-context";
import { NeuralNetworkModelContext } from "../../store/neural-network-model-context";
import { DATASETS, NEURAL_NETWORK_MODELS } from "../../constants/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";

export default function Header() {
  const { dataset, saveDataset } = useContext(DatasetContext);
  const { neuralNetworkModel, saveNeuralNetworkModel } = useContext(
    NeuralNetworkModelContext,
  );

  const handleGithubIconClick = () => {
    window.open(
      "https://github.com/gnueaj/Machine-Unlearning-Comparator",
      "_blank",
    );
  };

  const handleDatasetChange = (dataset: string) => {
    saveDataset(dataset);
  };

  const handleNeuralNetworkModelChange = (model: string) => {
    saveNeuralNetworkModel(model);
  };

  return (
    <div className="w-[1805px] text-white bg-black h-12 flex justify-between items-center px-4 relative">
      <div>
        <div className="flex items-center relative">
          <div className="flex items-center">
            <span className="text-2xl font-semibold mr-10">
              Unlearning Comparator
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
          <Select
            defaultValue={dataset}
            onValueChange={handleDatasetChange}
            name="dataset"
          >
            <SelectTrigger className="h-[10px] text-xs font-semibold p-0 bg-transparent focus:outline-none focus:ring-0 border-none">
              <SelectValue placeholder={dataset} />
            </SelectTrigger>
            <SelectContent>
              {DATASETS.map((dataset, idx) => (
                <SelectItem key={idx} value={dataset}>
                  {dataset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-300">Model</span>
          <Select
            defaultValue={neuralNetworkModel}
            onValueChange={handleNeuralNetworkModelChange}
            name="neuralNetworkModel"
          >
            <SelectTrigger className="h-[10px] text-xs font-semibold p-0 bg-transparent focus:outline-none focus:ring-0 border-none">
              <SelectValue placeholder={neuralNetworkModel} />
            </SelectTrigger>
            <SelectContent>
              {NEURAL_NETWORK_MODELS.map((neuralNetworkModel, idx) => (
                <SelectItem key={idx} value={neuralNetworkModel}>
                  {neuralNetworkModel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
