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
    ua: 0.013,
    ra: 0.989,
    ta: 0.947,
    mia: 31.92,
    avgGap: 0,
    rte: 1480.1,
    logits: 22.49,
  },
  {
    id: "7g9b",
    model: "ResNet18",
    dataset: "VggFace",
    forget: "1",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Random-Label",
    defense: "-",
    ua: 0.007,
    ra: 0.973,
    ta: 0.995,
    mia: 31.23,
    avgGap: 1.212,
    rte: 1460.2,
    logits: 21.77,
  },
  {
    id: "6k3a",
    model: "ResNet18",
    dataset: "VggFace",
    forget: "1",
    training: "-",
    unlearning: "Fine-Tuning",
    defense: "-",
    ua: 0.01,
    ra: 0.991,
    ta: 0.992,
    mia: 33.01,
    avgGap: 0,
    rte: 1473.8,
    logits: 23.12,
  },
  {
    id: "j30a",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forget: "2",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Gradient-Ascent",
    defense: "-",
    ua: 0.012,
    ra: 0.981,
    ta: 0.998,
    mia: 31.41,
    avgGap: 1.212,
    rte: 1465.5,
    logits: 22.64,
  },
  {
    id: "qq78",
    model: "ResNet18",
    dataset: "VggFace",
    forget: "2",
    training: "-",
    unlearning: "Fine-Tuning",
    defense: "-",
    ua: 0.011,
    ra: 0.997,
    ta: 0.987,
    mia: 30.99,
    avgGap: 0,
    rte: 1459.4,
    logits: 22.41,
  },
  {
    id: "p83h",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forget: "3",
    training: "-",
    unlearning: "Retrain",
    defense: "-",
    ua: 0.004,
    ra: 1.0,
    ta: 0.981,
    mia: 31.28,
    avgGap: 0,
    rte: 1491.7,
    logits: 22.38,
  },
  {
    id: "v097",
    model: "ResNet18",
    dataset: "VggFace",
    forget: "1",
    training: "-",
    unlearning: "Random-Label",
    defense: "-",
    ua: 0.009,
    ra: 0.914,
    ta: 0.967,
    mia: 32.42,
    avgGap: 1.212,
    rte: 1478.2,
    logits: 20.98,
  },
  {
    id: "z8c0",
    model: "ResNet18",
    dataset: "CIFAR-10",
    forget: "9",
    training: "best_train_resnet18_CIFAR10_30epochs_0.01lr.pth",
    unlearning: "Gradient-Ascent",
    defense: "-",
    ua: 0.012,
    ra: 0.957,
    ta: 0.964,
    mia: 30.15,
    avgGap: 1.212,
    rte: 1497.5,
    logits: 21.23,
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
      className="w-[1110px] p-[5px] relative border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center">
          <AnalysisTextLinkIcon />
          <h5 className="font-semibold ml-[3px]">Overview</h5>
        </div>
        <div className="flex flex-col items-start absolute right-[6px] top-3">
          <div className="text-[11px]">Performance</div>
          <div className="w-[250px] h-5 relative">
            <div
              className="w-full h-[10px]"
              style={{
                background: `linear-gradient(to right, ${colorScale(
                  0
                )}, ${colorScale(0.5)}, ${colorScale(1)})`,
              }}
            ></div>
            <div className="flex justify-between w-full text-[11px] mt-[2px]">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <DataTable columns={columns} data={payments} />
      </div>
    </section>
  );
}
