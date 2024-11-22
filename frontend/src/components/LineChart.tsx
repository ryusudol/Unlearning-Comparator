import { useContext } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  TooltipProps,
} from "recharts";

import { getCkaData } from "../utils/data/getCkaData";
import { ExperimentsContext } from "../store/experiments-context";
import { CircleIcon, MultiplicationSignIcon } from "./UI/icons";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "../components/UI/chart";

const PURPLE = "#a855f7";
const EMERALD = "#10b981";
const DOT_SIZE = 10;
const CROSS_SIZE = 16;
const ANIMATION_DURATION = 500;
const LABEL_FONT_SIZE = 10;
const ACTIVE_DOT_SIZE = 14;
const ACTIVE_CROSS_SIZE = 20;
const STROKE_WIDTH = 2;
const STROKE_DASHARRAY = "3 3";

const chartConfig = {
  layer: {
    label: "Layer",
    color: "#000",
  },
  baselineForgetCka: {
    label: "Baseline (Forget Class)",
    color: PURPLE,
  },
  baselineOtherCka: {
    label: "Baseline (Remain Classes)",
    color: PURPLE,
  },
  comparisonForgetCka: {
    label: "Comparison (Forget Class)",
    color: EMERALD,
  },
  comparisonOtherCka: {
    label: "Comparison (Remain Classes)",
    color: EMERALD,
  },
} satisfies ChartConfig;

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-sm shadow-xl">
        <div className="mb-1">
          <span>Layer: </span>
          <strong>{payload[0].payload.layer}</strong>
        </div>
        <div className="flex items-center">
          <MultiplicationSignIcon
            className="w-4 h-4 -ml-0.5 mr-0.5"
            style={{ color: PURPLE }}
          />
          <p>
            Baseline (Forget Class): <strong>{payload[0].value}</strong>
          </p>
        </div>
        <div className="flex items-center">
          <CircleIcon className="w-3 h-3 mr-1" style={{ color: PURPLE }} />
          <p>
            Baseline (Remain Classes): <strong>{payload[1].value}</strong>
          </p>
        </div>
        <div className="flex items-center">
          <MultiplicationSignIcon
            className="w-4 h-4 -ml-0.5 mr-0.5"
            color={EMERALD}
          />
          <p>
            Comparison (Forget Class): <strong>{payload[2].value}</strong>
          </p>
        </div>
        <div className="flex items-center">
          <CircleIcon className="w-3 h-3 mr-1" color={EMERALD} />
          <p>
            Comparison (Remain Classes): <strong>{payload[3].value}</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function MyLineChart({ dataset }: { dataset: string }) {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  if (!baselineExperiment || !comparisonExperiment) return null;

  const ckaData = getCkaData(dataset, baselineExperiment, comparisonExperiment);
  const layers = ckaData.map((data) => data.layer);

  return (
    <div className="relative">
      <CustomLegend />
      <p className="text-[15px] text-center">
        Per-layer Similarity Before/After Unlearning
      </p>
      <ChartContainer className="w-[490px] h-[260px]" config={chartConfig}>
        <LineChart
          accessibilityLayer
          data={ckaData}
          margin={{
            top: 5,
            right: 20,
            bottom: 34,
            left: -12,
          }}
        >
          <CartesianGrid />
          <XAxis
            dataKey="layer"
            tickLine={false}
            tickMargin={-2}
            angle={-45}
            textAnchor="end"
            tick={{ fontSize: LABEL_FONT_SIZE, fill: "#000000" }}
            ticks={layers}
            label={{
              value: "ResNet18 Layers",
              position: "center",
              dx: 34,
              dy: 30,
              style: {
                fontSize: 12,
                textAnchor: "end",
                fill: "#000000",
              },
            }}
          />
          <YAxis
            tickLine={false}
            domain={[0, 1]}
            interval={0}
            tick={{ fontSize: LABEL_FONT_SIZE, fill: "#000000" }}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
            tickMargin={-2}
            label={{
              value: "CKA Similarity",
              angle: -90,
              position: "center",
              dx: -4,
              style: {
                fontSize: 12,
                textAnchor: "middle",
                fill: "#000000",
              },
            }}
          />
          <ChartTooltip cursor={false} content={<CustomTooltip />} />
          <Line
            dataKey="baselineForgetCka"
            type="linear"
            stroke={chartConfig.baselineForgetCka.color}
            strokeWidth={STROKE_WIDTH}
            animationDuration={ANIMATION_DURATION}
            dot={({ cx, cy }) => (
              <MultiplicationSignIcon
                x={cx - CROSS_SIZE / 2}
                y={cy - CROSS_SIZE / 2}
                width={CROSS_SIZE}
                height={CROSS_SIZE}
                color={PURPLE}
              />
            )}
            activeDot={(props: any) => (
              <MultiplicationSignIcon
                x={props.cx - ACTIVE_CROSS_SIZE / 2}
                y={props.cy - ACTIVE_CROSS_SIZE / 2}
                width={ACTIVE_CROSS_SIZE}
                height={ACTIVE_CROSS_SIZE}
                color={PURPLE}
              />
            )}
          />
          <Line
            dataKey="baselineOtherCka"
            type="linear"
            stroke={chartConfig.baselineOtherCka.color}
            strokeWidth={STROKE_WIDTH}
            animationDuration={ANIMATION_DURATION}
            dot={({ cx, cy }) => (
              <CircleIcon
                x={cx - DOT_SIZE / 2}
                y={cy - DOT_SIZE / 2}
                width={DOT_SIZE}
                height={DOT_SIZE}
                color={PURPLE}
              />
            )}
            activeDot={(props: any) => (
              <CircleIcon
                x={props.cx - ACTIVE_DOT_SIZE / 2}
                y={props.cy - ACTIVE_DOT_SIZE / 2}
                width={ACTIVE_DOT_SIZE}
                height={ACTIVE_DOT_SIZE}
                color={PURPLE}
              />
            )}
          />
          <Line
            dataKey="comparisonForgetCka"
            type="linear"
            stroke={chartConfig.comparisonForgetCka.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={STROKE_DASHARRAY}
            animationDuration={ANIMATION_DURATION}
            dot={({ cx, cy }) => {
              return (
                <MultiplicationSignIcon
                  x={cx - CROSS_SIZE / 2}
                  y={cy - CROSS_SIZE / 2}
                  width={CROSS_SIZE}
                  height={CROSS_SIZE}
                  color={EMERALD}
                />
              );
            }}
            activeDot={(props: any) => (
              <MultiplicationSignIcon
                x={props.cx - ACTIVE_CROSS_SIZE / 2}
                y={props.cy - ACTIVE_CROSS_SIZE / 2}
                width={ACTIVE_CROSS_SIZE}
                height={ACTIVE_CROSS_SIZE}
                color={EMERALD}
              />
            )}
          />
          <Line
            dataKey="comparisonOtherCka"
            type="linear"
            stroke={chartConfig.comparisonOtherCka.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={STROKE_DASHARRAY}
            animationDuration={ANIMATION_DURATION}
            dot={({ cx, cy }) => {
              return (
                <CircleIcon
                  x={cx - DOT_SIZE / 2}
                  y={cy - DOT_SIZE / 2}
                  width={DOT_SIZE}
                  height={DOT_SIZE}
                  color={EMERALD}
                />
              );
            }}
            activeDot={(props: any) => (
              <CircleIcon
                x={props.cx - ACTIVE_DOT_SIZE / 2}
                y={props.cy - ACTIVE_DOT_SIZE / 2}
                width={ACTIVE_DOT_SIZE}
                height={ACTIVE_DOT_SIZE}
                color={EMERALD}
              />
            )}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function CustomLegend() {
  return (
    <div className="absolute top-[150px] left-14 text-xs leading-4">
      <div className="flex items-center">
        <div className="relative">
          <CircleIcon
            className={`mr-2 w-[${DOT_SIZE}px] h-[${DOT_SIZE}px]`}
            style={{ color: PURPLE }}
          />
          <div
            className="absolute top-1/2 w-[18px] h-[1px]"
            style={{
              backgroundColor: PURPLE,
              transform: "translate(-4px, -50%)",
            }}
          />
        </div>
        <span>Baseline (Remain Classes)</span>
      </div>
      <div className="flex items-center">
        <div className="relative">
          <CircleIcon
            className={`mr-2 w-[${DOT_SIZE}px] h-[${DOT_SIZE}px]`}
            style={{ color: EMERALD }}
          />
          <div
            className="absolute top-1/2 w-[18px]"
            style={{
              borderTop: `1px dashed ${EMERALD}`,
              transform: "translate(-4px, -50%)",
            }}
          />
        </div>
        <span>Comparison (Remain Classes)</span>
      </div>
      <div className="flex items-center">
        <div className="relative">
          <MultiplicationSignIcon
            width={CROSS_SIZE}
            height={CROSS_SIZE}
            color={PURPLE}
            className="mr-[5px] -ml-[3px]"
          />
          <div
            className="absolute top-1/2 w-[18px] h-[1px]"
            style={{
              backgroundColor: PURPLE,
              transform: "translate(-4px, -50%)",
            }}
          />
        </div>
        <span>Baseline (Forget Class)</span>
      </div>
      <div className="mb-1 flex items-center">
        <div className="relative">
          <MultiplicationSignIcon
            width={CROSS_SIZE}
            height={CROSS_SIZE}
            color={EMERALD}
            className="mr-[5px] -ml-[3px]"
          />
          <div
            className="absolute top-1/2 w-[18px]"
            style={{
              borderTop: `1px dashed ${EMERALD}`,
              transform: "translate(-4px, -50%)",
            }}
          />
        </div>
        <span>Comparison (Forget Class)</span>
      </div>
    </div>
  );
}
