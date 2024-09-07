import { useContext, useEffect } from "react";
import styles from "./PerformanceOverview.module.css";

import { OverviewContext } from "../store/overview-context";
import { BaselineContext } from "../store/baseline-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { retrainedData } from "../constants/gt";
import { getColorForValue } from "../util";
import { SettingsIcon } from "../components/UI/icons";
import DataTable from "../components/DataTable";
import { Overview, columns } from "../components/Columns";

export const payments: Overview[] = [
  {
    id: "231a",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "0",
    training: "-",
    unlearning: "Retrain",
    defense: "-",
    ua: 0.977,
    ra: 1.0,
    ta: 0.936,
    mia: 31.92,
    avgGap: 0,
    rte: 1480.1,
    logits: 22.49,
  },
  {
    id: "231b",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "1",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Random-Label",
    defense: "-",
    ua: 0.012,
    ra: 0.948,
    ta: 0.998,
    mia: 31.92,
    avgGap: 1.212,
    rte: 1460.1,
    logits: 21.77,
  },
  {
    id: "231c",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "0",
    training: "-",
    unlearning: "Retrain",
    defense: "-",
    ua: 0.977,
    ra: 1.0,
    ta: 0.936,
    mia: 31.92,
    avgGap: 0,
    rte: 1480.1,
    logits: 22.49,
  },
  {
    id: "231d",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "1",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Random-Label",
    defense: "-",
    ua: 0.012,
    ra: 0.948,
    ta: 0.998,
    mia: 31.92,
    avgGap: 1.212,
    rte: 1460.1,
    logits: 21.77,
  },
  {
    id: "231c",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "0",
    training: "-",
    unlearning: "Retrain",
    defense: "-",
    ua: 0.977,
    ra: 1.0,
    ta: 0.936,
    mia: 31.92,
    avgGap: 0,
    rte: 1480.1,
    logits: 22.49,
  },
  {
    id: "231a",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "0",
    training: "-",
    unlearning: "Retrain",
    defense: "-",
    ua: 0.977,
    ra: 1.0,
    ta: 0.936,
    mia: 31.92,
    avgGap: 0,
    rte: 1480.1,
    logits: 22.49,
  },
  {
    id: "231d",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "1",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Random-Label",
    defense: "-",
    ua: 0.012,
    ra: 0.948,
    ta: 0.998,
    mia: 31.92,
    avgGap: 1.212,
    rte: 1460.1,
    logits: 21.77,
  },
  {
    id: "231b",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forgetClass: "1",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Random-Label",
    defense: "-",
    ua: 0.012,
    ra: 0.948,
    ta: 0.998,
    mia: 31.92,
    avgGap: 1.212,
    rte: 1460.1,
    logits: 21.77,
  },
];

interface Props {
  height: number;
}

export default function PerformanceOverview({ height }: Props) {
  const { overview, retrieveOverview } = useContext(OverviewContext);
  const { baseline } = useContext(BaselineContext);
  const { selectedID, saveSelectedID } = useContext(SelectedIDContext);

  useEffect(() => {
    retrieveOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOverview = overview.filter(
    (el) => el.forget_class === baseline.toString()
  );

  const handleTableRowClick = (idx: number) => {
    saveSelectedID(idx);
  };

  const currRetrainedData = retrainedData[baseline];
  const retrainedUA = currRetrainedData.unlearn_accuracy;
  const retrainedRA = currRetrainedData.remain_accuracy;
  const retrainedTA = currRetrainedData.test_accuracy;

  return (
    <section style={{ height: `${height}px` }} className="w-[1110px] p-[6px]">
      <div className={styles.top}>
        <div className="flex items-center">
          <SettingsIcon />
          <h5 className="font-semibold ml-[3px]">Overview</h5>
        </div>
        {/* <div className={styles.legend}>
          <div className={styles["legend-title"]}>Acc</div>
          <div className={styles.bar}>
            <div className={styles.gradient}></div>
            <div className={styles["legend-values"]}>
              <span>0</span>
              <span>1</span>
            </div>
          </div>
        </div> */}
      </div>
      <div className="py-1">
        <DataTable columns={columns} data={payments} />
      </div>
    </section>
  );
}
