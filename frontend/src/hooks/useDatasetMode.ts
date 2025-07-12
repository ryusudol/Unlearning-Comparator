import { useBaseConfigStore } from "../stores/baseConfigStore";

export const useDatasetMode = () => {
  const dataset = useBaseConfigStore((state) => state.dataset);
  return dataset === "FaceDataset" ? "face" : "cifar10";
};
