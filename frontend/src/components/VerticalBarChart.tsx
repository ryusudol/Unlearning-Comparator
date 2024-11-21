import { useMemo, useContext } from "react";
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

import { NeuralNetworkIcon } from "./UI/icons";
import { forgetClassNames } from "../constants/forgetClassNames";
import { TABLEAU10 } from "../constants/tableau10";
import { ChartContainer, type ChartConfig } from "./UI/chart";
import { ForgetClassContext } from "../store/forget-class-context";
import { GapDataItem } from "../views/Accuracies";

const TOOLTIP_FIX_LENGTH = 3;
const LABEL_FONT_SIZE = 10;

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

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as GapDataItem;
    return (
      <div className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-sm shadow-xl">
        <p className="font-medium">
          Class: {forgetClassNames[+data.classLabel]}
        </p>
        <div className="flex items-center">
          <NeuralNetworkIcon className="text-purple-500 mr-1" />
          <p>Baseline: {data.baselineAccuracy.toFixed(TOOLTIP_FIX_LENGTH)}</p>
        </div>
        <div className="flex items-center">
          <NeuralNetworkIcon className="text-orange-500 mr-1" />
          <p>
            Comparison: {data.comparisonAccuracy.toFixed(TOOLTIP_FIX_LENGTH)}
          </p>
        </div>
        <p>Difference: {data.gap.toFixed(TOOLTIP_FIX_LENGTH)}</p>
      </div>
    );
  }
  return null;
}

interface Props {
  mode: "Training" | "Test";
  gapData: GapDataItem[];
  maxGap: number;
  showYAxis?: boolean;
}

export default function VerticalBarChart({
  mode,
  gapData,
  maxGap,
  showYAxis = true,
}: Props) {
  const { forgetClass } = useContext(ForgetClassContext);

  const remainGapAvgValue = useMemo(() => {
    if (!forgetClass) return 0;

    const remainingData = gapData.filter(
      (datum) =>
        forgetClassNames[+datum.classLabel] !== forgetClassNames[forgetClass]
    );

    return remainingData.length
      ? remainingData.reduce((sum, datum) => sum + datum.gap, 0) /
          remainingData.length
      : 0;
  }, [gapData, forgetClass]);
  const remainGapAvg = Number(remainGapAvgValue.toFixed(3));

  return (
    <div className="flex flex-col justify-center items-center relative bottom-1">
      <span
        className={`text-[15px] relative ${
          mode === "Training" ? "left-4" : "right-3.5"
        }`}
      >
        {mode} Dataset
      </span>
      <ChartContainer
        config={chartConfig}
        className={`${showYAxis ? "w-[280px]" : "w-[220px]"} h-[256px]`}
      >
        <BarChart
          accessibilityLayer
          data={gapData}
          layout="vertical"
          margin={{
            left: 8,
            right: 8,
            top: 12,
            bottom: 0,
          }}
        >
          <YAxis
            limitingConeAngle={30}
            dataKey="category"
            type="category"
            tickLine={false}
            axisLine={true}
            interval={0}
            fontSize={LABEL_FONT_SIZE}
            tick={showYAxis}
            width={showYAxis ? 60 : 1}
            tickMargin={-1}
            tickFormatter={(value) => {
              const label =
                chartConfig[value as keyof typeof chartConfig]?.label;
              const isForgetClass =
                forgetClass && label === forgetClassNames[forgetClass];
              return isForgetClass ? label + " (X)" : label;
            }}
            style={{ whiteSpace: "nowrap", fill: "black" }}
          />
          <XAxis
            dataKey="value"
            type="number"
            domain={[-maxGap, maxGap]}
            tickFormatter={(value) => value.toString()}
            fontSize={LABEL_FONT_SIZE}
            ticks={[-maxGap, 0, maxGap]}
          >
            <Label
              fill="black"
              className="-translate-y-2 text-xs font-light"
              value={`← Baseline High | Comparison High →`}
              offset={-3}
              dx={9}
              position="bottom"
            />
          </XAxis>
          <ReferenceLine x={0} stroke="#777" />
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <Bar dataKey="gap" layout="vertical" barSize={10} />
          <ReferenceLine
            x={remainGapAvg}
            stroke="#777"
            strokeDasharray="3 3"
            label={{
              value: `avg (remain): ${remainGapAvg}`,
              position: "top",
              fontSize: LABEL_FONT_SIZE,
              fill: "#777",
              offset: 3.5,
            }}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
