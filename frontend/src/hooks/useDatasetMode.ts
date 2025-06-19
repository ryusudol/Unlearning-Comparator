import { useBaseConfigStore } from "../stores/baseConfigStore";

export const useDatasetMode = () => {
  const dataset = useBaseConfigStore((state) => state.dataset);
  const datasetMode =
    dataset === "FaceDataset"
      ? "face"
      : dataset === "CIFAR-10"
      ? "cifar10"
      : "cifar10";
  return datasetMode;
};
