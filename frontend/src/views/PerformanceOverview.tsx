import { useContext, useEffect } from "react";
import * as d3 from "d3";

import { OverviewContext } from "../store/overview-context";
import { BaselineContext } from "../store/baseline-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { retrainedData } from "../constants/gt";
import { AnalysisTextLinkIcon } from "../components/UI/icons";
import DataTable from "../components/DataTable";
import { Overview, columns } from "../components/Columns";

export const payments: Overview[] = [
  {
    id: "231a",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forget: "0",
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
    forget: "1",
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
    forget: "2",
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
    forget: "3",
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
    forget: "4",
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
    forget: "5",
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
    forget: "1",
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
    forget: "9",
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

  const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([1, 0]);

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1110px] p-[6px] relative"
    >
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center">
          <AnalysisTextLinkIcon />
          <h5 className="font-semibold ml-[3px]">Overview</h5>
        </div>
        <div className="flex flex-col items-start absolute right-[6px] top-[6px]">
          <div className="text-[12px]">Performance</div>
          <div className="w-[250px] h-5 relative">
            <div
              className="w-full h-[10px]"
              style={{
                background: `linear-gradient(to right, ${colorScale(
                  0
                )}, ${colorScale(0.5)}, ${colorScale(1)})`,
              }}
            ></div>
            <div className="flex justify-between w-full text-[12px] mt-[2px]">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
      <div className="py-1">
        <DataTable columns={columns} data={payments} />
      </div>
    </section>
  );
}
