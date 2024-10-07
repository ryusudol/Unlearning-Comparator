import { useContext } from "react";
import { Bar, BarChart, XAxis, YAxis, ReferenceLine, Label } from "recharts";

import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { basicData } from "../constants/basicData";
import { TABLEAU10 } from "../constants/tableau10";
import { Chart01Icon } from "../components/ui/icons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";

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

interface ClassAccuracies {
  "0": string;
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
  "6": string;
  "7": string;
  "8": string;
  "9": string;
}
interface Props {
  height: number;
}

export default function PerformanceMetrics({ height }: Props) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);

  const baselineTrainAccuracies: ClassAccuracies =
    basicData[+baseline].train_class_accuracies;
  const comparisonTrainAccuracies: ClassAccuracies =
    basicData[+comparison].train_class_accuracies;
  const baselineTestAccuracies: ClassAccuracies =
    basicData[+baseline].test_class_accuracies;
  const comparisonTestAccuracies: ClassAccuracies =
    basicData[+comparison].test_class_accuracies;

  const trainAccuracyGap = Object.keys(baselineTrainAccuracies).map(
    (key, idx) => {
      const baselineValue = parseFloat(
        baselineTrainAccuracies[key as keyof ClassAccuracies]
      );
      const comparisonValue = parseFloat(
        comparisonTrainAccuracies[key as keyof ClassAccuracies]
      );
      return {
        value: parseFloat((baselineValue - comparisonValue).toFixed(2)),
        fill: TABLEAU10[idx],
      };
    }
  );

  const testAccuracyGap = Object.keys(baselineTestAccuracies).map(
    (key, idx) => {
      const baselineValue = parseFloat(
        baselineTestAccuracies[key as keyof ClassAccuracies]
      );
      const comparisonValue = parseFloat(
        comparisonTestAccuracies[key as keyof ClassAccuracies]
      );
      return {
        value: parseFloat((baselineValue - comparisonValue).toFixed(2)),
        fill: TABLEAU10[idx],
      };
    }
  );

  const maxValue =
    Math.ceil(
      Math.max(...trainAccuracyGap.map((item) => Math.abs(item.value))) * 100
    ) / 100;

  return (
    <section
      style={{ height: height }}
      className="w-[480px] p-[5px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-[3px]">Accuracies</h5>
      </div>
      <div className="w-full flex flex-col justify-start items-center">
        <div className="flex justify-center items-center mt-[6px] -ml-6">
          <p className="w-10 -rotate-90 origin-left translate-x-7 translate-y-[26px] text-[13px] text-[#808080]">
            Classes
          </p>
          {/* Training Dataset Bar Chart */}
          <div className="flex flex-col justify-center items-center">
            <h5 className="text-[14px] mb-2">Training Dataset</h5>
            <ChartContainer
              config={chartConfig}
              className="w-[212px] h-[220px]"
            >
              <BarChart
                accessibilityLayer
                data={trainAccuracyGap}
                layout="vertical"
                margin={{
                  left: -40,
                  right: 0,
                  top: 0,
                  bottom: 8,
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
                >
                  <Label
                    className="text-black -translate-y-[6px] text-[13px]"
                    value="Accuracy Gap"
                    offset={0}
                    position="bottom"
                  />
                </XAxis>
                <ReferenceLine x={0} stroke="#777" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </div>
          {/* Test Dataset Bar Chart */}
          <div className="flex flex-col justify-center items-center">
            <h5 className="text-[14px] mb-2">Test Dataset</h5>
            <ChartContainer
              config={chartConfig}
              className="w-[212px] h-[220px]"
            >
              <BarChart
                accessibilityLayer
                data={testAccuracyGap}
                layout="vertical"
                margin={{
                  left: -40,
                  right: 0,
                  top: 0,
                  bottom: 8,
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
                >
                  <Label
                    className="text-black -translate-y-[6px] text-[13px]"
                    value="Accuracy Gap"
                    offset={0}
                    position="bottom"
                  />
                </XAxis>
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
