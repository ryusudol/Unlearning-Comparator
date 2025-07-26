import { UNLEARNING_METHODS } from "../../constants/experiments";

export function getDefaultUnlearningConfig(method: string) {
  let epoch, learning_rate, batch_size;

  if (method === UNLEARNING_METHODS["Fine-Tuning"]) {
    epoch = "1";
    learning_rate = "0.001";
    batch_size = "64";
  } else if (method === UNLEARNING_METHODS["Random Labeling"]) {
    epoch = "3";
    learning_rate = "0.001";
    batch_size = "64";
  } else if (method === UNLEARNING_METHODS["GA+FT"]) {
    epoch = "5";
    learning_rate = "0.001";
    batch_size = "128";
  } else if (method === UNLEARNING_METHODS["GA+SL+FT"]) {
    epoch = "5";
    learning_rate = "0.001";
    batch_size = "128";
  } else if (method === UNLEARNING_METHODS["SCRUB"]) {
    epoch = "5";
    learning_rate = "0.01";
    batch_size = "128";
  } else {
    epoch = "3";
    learning_rate = "0.001";
    batch_size = "128";
  }

  return { epoch, learning_rate, batch_size };
}
