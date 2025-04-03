import Tabs from "./Tabs";
import { Logo } from "../UI/icons";
import { useBaseConfigStore } from "../../stores/baseConfigStore";
import { DATASETS, NEURAL_NETWORK_MODELS } from "../../constants/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";

export default function Header() {
  const { dataset, setDataset, neuralNetworkModel, setNeuralNetworkModel } =
    useBaseConfigStore();

  const handleDatasetChange = (dataset: string) => {
    setDataset(dataset);
  };

  const handleNeuralNetworkModelChange = (model: string) => {
    setNeuralNetworkModel(model);
  };

  return (
    <div className="w-[1805px] text-white bg-black h-[52px] flex justify-between items-center px-4 relative">
      <div className="flex items-center relative">
        <div className="flex items-center gap-2 mr-8">
          <Logo />
          <span className="text-[28px] font-semibold">
            Unlearning Comparator
          </span>
        </div>
        <div className="w-[150px] flex gap-4 relative top-2 text-[13px] mr-5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-300">Architecture</span>
            <Select
              defaultValue={neuralNetworkModel}
              onValueChange={handleNeuralNetworkModelChange}
              name="neuralNetworkModel"
            >
              <SelectTrigger className="w-fit h-[10px] text-xs font-semibold p-0 bg-transparent focus:outline-none focus:ring-0 border-none">
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
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-300">Dataset</span>
            <Select
              defaultValue={dataset}
              onValueChange={handleDatasetChange}
              name="dataset"
            >
              <SelectTrigger className="w-fit h-[10px] text-xs font-semibold p-0 bg-transparent focus:outline-none focus:ring-0 border-none">
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
        </div>
        <Tabs />
      </div>
    </div>
  );
}
