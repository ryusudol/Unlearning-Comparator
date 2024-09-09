import { useContext } from "react";
import { Bar, BarChart, XAxis, YAxis, ReferenceLine } from "recharts";

import { retrainedData } from "../constants/gt";
import { BaselineContext } from "../store/baseline-context";
import { OverviewContext } from "../store/overview-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { TABLEAU10 } from "../constants/tableau10";
import { Chart01Icon } from "../components/UI/icons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/UI/chart";

const trainAccuracyGap = [
  {
    category: "A",
    value: 0.03,
    fill: TABLEAU10[0],
  },
  {
    category: "B",
    value: 0.01,
    fill: TABLEAU10[1],
  },
  {
    category: "C",
    value: -0.04,
    fill: TABLEAU10[2],
  },
  {
    category: "D",
    value: 0.02,
    fill: TABLEAU10[3],
  },
  {
    category: "E",
    value: 0.01,
    fill: TABLEAU10[4],
  },
  {
    category: "F",
    value: -0.03,
    fill: TABLEAU10[5],
  },
  {
    category: "G",
    value: 0,
    fill: TABLEAU10[6],
  },
  {
    category: "H",
    value: -0.01,
    fill: TABLEAU10[7],
  },
  {
    category: "I",
    value: 0.01,
    fill: TABLEAU10[8],
  },
  {
    category: "J",
    value: 0.02,
    fill: TABLEAU10[9],
  },
];

const trainAccuracyGap2 = [
  {
    category: "A",
    value: 0.01,
    fill: TABLEAU10[0],
  },
  {
    category: "B",
    value: -0.01,
    fill: TABLEAU10[1],
  },
  {
    category: "C",
    value: -0.03,
    fill: TABLEAU10[2],
  },
  {
    category: "D",
    value: -0.02,
    fill: TABLEAU10[3],
  },
  {
    category: "E",
    value: 0.01,
    fill: TABLEAU10[4],
  },
  {
    category: "F",
    value: 0.02,
    fill: TABLEAU10[5],
  },
  {
    category: "G",
    value: 0.04,
    fill: TABLEAU10[6],
  },
  {
    category: "H",
    value: -0.01,
    fill: TABLEAU10[7],
  },
  {
    category: "I",
    value: 0.01,
    fill: TABLEAU10[8],
  },
  {
    category: "J",
    value: 0.02,
    fill: TABLEAU10[9],
  },
];

const chartConfig = {
  value: {
    label: "Value",
  },
  A: {
    label: "0",
    color: TABLEAU10[0],
  },
  B: {
    label: "1",
    color: TABLEAU10[1],
  },
  C: {
    label: "2",
    color: TABLEAU10[2],
  },
  D: {
    label: "3",
    color: TABLEAU10[3],
  },
  E: {
    label: "4",
    color: TABLEAU10[4],
  },
  F: {
    label: "5",
    color: TABLEAU10[5],
  },
  G: {
    label: "6",
    color: TABLEAU10[6],
  },
  H: {
    label: "7",
    color: TABLEAU10[7],
  },
  I: {
    label: "8",
    color: TABLEAU10[8],
  },
  J: {
    label: "9",
    color: TABLEAU10[9],
  },
} satisfies ChartConfig;

interface Props {
  height: number;
}

export default function PerformanceMetrics({ height }: Props) {
  const { baseline } = useContext(BaselineContext);
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);

  const currRetrainedData = retrainedData[baseline];
  const currOverview = overview.filter(
    (item) => item.forget_class === baseline.toString()
  );
  const currOverviewItem = currOverview[selectedID];

  const maxValue =
    Math.ceil(
      Math.max(...trainAccuracyGap.map((item) => Math.abs(item.value))) * 100
    ) / 100;

  return (
    <section className="w-[460px] p-[6px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]">
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-[3px]">Accuracies</h5>
      </div>
      <div className="w-full flex flex-col justify-center items-center">
        <div className="flex justify-center items-center mt-[6px]">
          <div className="flex flex-col justify-center items-center">
            <h5 className="text-[14px] mb-2">Train</h5>
            <ChartContainer
              config={chartConfig}
              className="w-[220px] h-[200px]"
            >
              <BarChart
                accessibilityLayer
                data={trainAccuracyGap}
                layout="vertical"
                margin={{
                  left: -40,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              >
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={true}
                  interval={0}
                  tickFormatter={(value) =>
                    chartConfig[value as keyof typeof chartConfig]?.label
                  }
                />
                <XAxis
                  dataKey="value"
                  type="number"
                  domain={[-maxValue, maxValue]}
                  tickFormatter={(value) => value.toString()}
                />
                <ReferenceLine x={0} stroke="#777" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="flex flex-col justify-center items-center">
            <h5 className="text-[14px] mb-2">Test</h5>
            <ChartContainer
              config={chartConfig}
              className="w-[220px] h-[200px]"
            >
              <BarChart
                accessibilityLayer
                data={trainAccuracyGap2}
                layout="vertical"
                margin={{
                  left: -40,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              >
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={true}
                  interval={0}
                  tickFormatter={(value) =>
                    chartConfig[value as keyof typeof chartConfig]?.label
                  }
                />
                <XAxis
                  dataKey="value"
                  type="number"
                  domain={[-maxValue, maxValue]}
                  tickFormatter={(value) => value.toString()}
                />
                <ReferenceLine x={0} stroke="#777" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
