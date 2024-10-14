import { Overview } from "../types/overview";

import data1 from "./5065.json";
import data2 from "./b9e5.json";
import data3 from "./be3b.json";
import data4 from "./d077.json";

export const basicData = [data1, data2, data3, data4];

export const overviewData: Overview[] = basicData.map((datum) => {
  return {
    id: datum.id,
    forget: datum.forget_class,
    phase: datum.phase,
    method: datum.method,
    epochs: datum.epochs,
    batchSize: datum.batch_size,
    lr: datum.learning_rate,
    seed: datum.seed,
    ua: Number(datum.unlearn_accuracy.toFixed(3)),
    ra: Number(datum.remain_accuracy.toFixed(3)),
    tua: Number(datum.test_unlearn_accuracy.toFixed(3)),
    tra: Number(datum.test_remain_accuracy.toFixed(3)),
    rte:
      typeof datum.RTE === "number"
        ? Number((datum.RTE as number).toFixed(1))
        : datum.RTE,
    trainClassAccuracies: datum.train_class_accuracies,
    testClassAccuracies: datum.test_class_accuracies,
    trainLabelDistribution: datum.train_label_distribution,
    trainConfidenceDistribution: datum.train_confidence_distribution,
    testLabelDistribution: datum.test_label_distribution,
    testConfidenceDistribution: datum.test_confidence_distribution,
  };
});
