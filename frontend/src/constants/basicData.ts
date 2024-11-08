import { UnlearningDataType, TrainingDataType } from "../types/data";

import training from "./JSON/training.json";
import data0 from "./JSON/0/9f4d.json";
import data1 from "./JSON/1/b5c3.json";
import data2 from "./JSON/2/ea48.json";
import data3 from "./JSON/3/f0f5.json";
import data4 from "./JSON/4/8882.json";
import data5 from "./JSON/5/49c0.json";
import data6 from "./JSON/6/b0d0.json";
import data11 from "./JSON/6/b163.json";
import data12 from "./JSON/6/1369.json";
import data7 from "./JSON/6/724c.json";
import data8 from "./JSON/7/0b65.json";
import data9 from "./JSON/8/4b3e.json";
import data10 from "./JSON/9/9bbe.json";

export const basicData = [
  training,
  data0,
  data1,
  data2,
  data3,
  data4,
  data5,
  data6,
  data7,
  data8,
  data9,
  data10,
  data11,
  data12,
];

export const defaultUnlearningData: UnlearningDataType[] = (
  basicData.slice(1) as UnlearningDataType[]
).map((datum) => {
  return {
    id: datum.id,
    forget_class: datum.forget_class,
    phase: datum.phase,
    init_id: datum.init_id,
    method: datum.method,
    epochs: datum.epochs,
    batch_size: datum.batch_size,
    learning_rate: datum.learning_rate,
    unlearn_accuracy: Number((datum.unlearn_accuracy as number).toFixed(3)),
    remain_accuracy: Number(datum.remain_accuracy.toFixed(3)),
    test_unlearn_accuracy: Number(
      (datum.test_unlearn_accuracy as number).toFixed(3)
    ),
    test_remain_accuracy: Number(datum.test_remain_accuracy.toFixed(3)),
    RTE: datum.RTE,
    train_class_accuracies: datum.train_class_accuracies,
    test_class_accuracies: datum.test_class_accuracies,
    train_label_distribution: datum.train_label_distribution,
    train_confidence_distribution: datum.train_confidence_distribution,
    test_label_distribution: datum.test_label_distribution,
    test_confidence_distribution: datum.test_confidence_distribution,
    similarity: datum.similarity,
    detailed_results: datum.detailed_results,
  };
});

export const defaultTrainingData: TrainingDataType = training;
