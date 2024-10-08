import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
  Tooltip,
  TooltipProps,
} from "recharts";

import { TABLEAU10 } from "../constants/tableau10";
import { ChartContainer, type ChartConfig } from "../components/ui/chart";

const chartConfig = {
  value: {
    label: "Gap",
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

interface GapDataItem {
  category: string;
  classLabel: string;
  value: number;
  fill: string;
  baselineAccuracy: number;
  comparisonAccuracy: number;
}
interface Props {
  mode: "Training" | "Test";
  gapData: GapDataItem[];
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as GapDataItem;
    return (
      <div className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-xs shadow-xl">
        <p className="font-medium text-[13px]">Class: {data.classLabel}</p>
        <p>Gap: {data.value.toFixed(2)}</p>
        <p>Baseline: {data.baselineAccuracy.toFixed(2)}</p>
        <p>Comparison: {data.comparisonAccuracy.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export default function MyBarChart({ mode, gapData }: Props) {
  const maxValue =
    Math.ceil(Math.max(...gapData.map((item) => Math.abs(item.value))) * 100) /
    100;

  return (
    <div className="flex flex-col justify-center items-center">
      <h5 className="text-[14px] mb-2">{mode} Dataset</h5>
      <ChartContainer config={chartConfig} className="w-[212px] h-[220px]">
        <BarChart
          accessibilityLayer
          data={gapData}
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
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <Bar dataKey="value" layout="vertical" radius={5} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
