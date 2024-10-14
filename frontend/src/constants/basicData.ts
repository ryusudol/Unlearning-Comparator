import { Data } from "../types/data";

import data1 from "./5065.json";
import data2 from "./b9e5.json";
import data3 from "./be3b.json";
import data4 from "./d077.json";

export const basicData = [data1, data2, data3, data4];

export const overviewData: Data[] = basicData.map((datum) => {
  return {
    id: datum.id,
    forget_class: datum.forget_class,
    phase: datum.phase,
    method: datum.method,
    epochs: datum.epochs,
    batch_size: datum.batch_size,
    learning_rate: datum.learning_rate,
    seed: datum.seed,
    unlearn_accuracy: Number(datum.unlearn_accuracy.toFixed(3)),
    remain_accuracy: Number(datum.remain_accuracy.toFixed(3)),
    test_unlearn_accuracy: Number(datum.test_unlearn_accuracy.toFixed(3)),
    test_remain_accuracy: Number(datum.test_remain_accuracy.toFixed(3)),
    RTE:
      typeof datum.RTE === "number"
        ? Number((datum.RTE as number).toFixed(1))
        : datum.RTE,
    train_label_distribution: datum.train_label_distribution,
    train_confidence_distribution: datum.train_confidence_distribution,
    test_label_distribution: datum.test_label_distribution,
    test_confidence_distribution: datum.test_confidence_distribution,
  };
});
