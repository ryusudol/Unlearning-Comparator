import { useContext } from "react";
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

import { forgetClassNames } from "../constants/forgetClassNames";
import { TABLEAU10 } from "../constants/tableau10";
import { ChartContainer, type ChartConfig } from "../components/ui/chart";
import { ForgetClassContext } from "../store/forget-class-context";

const chartConfig = {
  value: {
    label: "Gap",
  },
  A: {
    label: "airplane",
    color: TABLEAU10[0],
  },
  B: {
    label: "automobile",
    color: TABLEAU10[1],
  },
  C: {
    label: "bird",
    color: TABLEAU10[2],
  },
  D: {
    label: "cat",
    color: TABLEAU10[3],
  },
  E: {
    label: "deer",
    color: TABLEAU10[4],
  },
  F: {
    label: "dog",
    color: TABLEAU10[5],
  },
  G: {
    label: "frog",
    color: TABLEAU10[6],
  },
  H: {
    label: "horse",
    color: TABLEAU10[7],
  },
  I: {
    label: "ship",
    color: TABLEAU10[8],
  },
  J: {
    label: "truck",
    color: TABLEAU10[9],
  },
} satisfies ChartConfig;

interface GapDataItem {
  category: string;
  classLabel: string;
  gap: number;
  fill: string;
  baselineAccuracy: number;
  comparisonAccuracy: number;
}
interface CustomAxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string;
    index: number;
  };
}
interface Props {
  mode: "Training" | "Test";
  gapData: GapDataItem[] | [];
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as GapDataItem;
    return (
      <div className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-xs shadow-xl">
        <p className="font-medium text-[13px]">
          Class: {forgetClassNames[+data.classLabel]}
        </p>
        <p>Gap: {data.gap.toFixed(2)}</p>
        <p>Baseline: {data.baselineAccuracy.toFixed(2)}</p>
        <p>Comparison: {data.comparisonAccuracy.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export default function MyBarChart({ mode, gapData }: Props) {
  const { forgetClass } = useContext(ForgetClassContext);

  const maxValue =
    Math.ceil(Math.max(...gapData.map((item) => Math.abs(item.gap))) * 100) /
    100;

  function renderCustomAxisTick(props: CustomAxisTickProps) {
    const { x, y, payload } = props;
    const label = chartConfig[payload.value as keyof typeof chartConfig]?.label;
    const isForgetClass = label === forgetClass;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={isForgetClass ? -5 : -15}
          dy={16}
          textAnchor="end"
          transform={isForgetClass ? "" : "rotate(-30)"}
          style={{ fill: isForgetClass ? "#000000" : "#64758B" }}
          fontWeight={isForgetClass ? 700 : 400}
          fontSize={isForgetClass ? "28px" : "12px"}
        >
          {isForgetClass ? "×" : label}
        </text>
      </g>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center mt-1">
      <h5 className="text-[14px] mb-1 ml-[52px]">{mode} Dataset</h5>
      <ChartContainer config={chartConfig} className="w-[232px] h-[223px]">
        <BarChart
          accessibilityLayer
          data={gapData}
          layout="vertical"
          margin={{
            left: -5,
            right: 0,
            top: 0,
            bottom: 5,
          }}
        >
          <YAxis
            limitingConeAngle={30}
            dataKey="category"
            type="category"
            tickLine={false}
            axisLine={true}
            interval={0}
            tick={renderCustomAxisTick}
          />
          <XAxis
            dataKey="value"
            type="number"
            domain={[-maxValue, maxValue]}
            tickFormatter={(value) => value.toString()}
          >
            <Label
              className="text-black -translate-y-[6px] text-[13px]"
              value="Accuracy Gap (Comp.- Base.)"
              offset={0}
              position="bottom"
            />
          </XAxis>
          <ReferenceLine x={0} stroke="#777" />
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <Bar dataKey="gap" layout="vertical" radius={5} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
