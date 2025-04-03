import { useBaseConfigStore } from "../stores/baseConfigStore";
import { CIFAR_10_CLASSES, FASHION_MNIST_CLASSES } from "../constants/common";

export function useClasses() {
  const dataset = useBaseConfigStore((state) => state.dataset);
  return dataset === "CIFAR-10" ? CIFAR_10_CLASSES : FASHION_MNIST_CLASSES;
}
