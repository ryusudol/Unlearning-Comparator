import { Overview } from "../components/Columns";
import data1 from "./478e.json";
import data2 from "./59d4.json";
import data3 from "./b824.json";
import data4 from "./6081.json";
import data5 from "./50f6.json";

export const basicData = [data1, data2, data3, data4, data5];

export const overviewData: Overview[] = basicData.map((datum) => {
  return {
    id: datum.id,
    forget: datum.forget_class,
    phase: datum.phase,
    method: datum.method,
    epochs: datum.epochs,
    lr: datum.learning_rate,
    batchSize: datum.batch_size,
    seed: datum.seed,
    ua: Number(datum.unlearn_accuracy.toFixed(3)),
    ra: Number(datum.remain_accuracy.toFixed(3)),
    tua: Number(datum.test_unlearn_accuracy.toFixed(3)),
    tra: Number(datum.test_remain_accuracy.toFixed(3)),
    rte:
      typeof datum.RTE === "number" ? Number(datum.RTE.toFixed(1)) : datum.RTE,
  };
});
