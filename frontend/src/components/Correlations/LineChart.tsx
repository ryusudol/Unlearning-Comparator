import { useContext, useState, memo, useCallback } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
} from "recharts";

import {
  CKA_DATA_KEYS,
  LINE_CHART_TICK_STYLE,
  LINE_CHART_CONFIG,
} from "../../constants/correlations";
import {
  STROKE_CONFIG,
  FONT_CONFIG,
  ANIMATION_DURATION,
} from "../../constants/common";
import { COLORS } from "../../constants/colors";
import { getCkaData } from "../../utils/data/getCkaData";
import { ExperimentsContext } from "../../stores/experiments-context";
import { CircleIcon, FatMultiplicationSignIcon } from "../UI/icons";
import { ChartContainer } from "../UI/chart";

const CONFIG = {
  DOT_SIZE: 10,
  CROSS_SIZE: 12,
  ACTIVE_DOT_STROKE_WIDTH: 3,
  ACTIVE_CROSS_STROKE_WIDTH: 2,
  zIndex: 9999,
} as const;

const AxisTick = memo(({ x, y, payload, hoveredLayer }: TickProps) => (
  <text
    x={x}
    y={y}
    dy={8}
    textAnchor="end"
    transform={`rotate(-45, ${x}, ${y})`}
    fontSize={FONT_CONFIG.FONT_SIZE_10}
    fontWeight={
      hoveredLayer === payload.value ? "bold" : FONT_CONFIG.LIGHT_FONT_WEIGHT
    }
  >
    {payload.value}
  </text>
));

type TickProps = {
  x: number;
  y: number;
  payload: any;
  hoveredLayer: string | null;
};

export default function _LineChart({ dataset }: { dataset: string }) {
  const { baselineExperiment, comparisonExperiment } =
    useContext(ExperimentsContext);

  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const renderTick = useCallback(
    (props: any) => <AxisTick {...props} hoveredLayer={hoveredLayer} />,
    [hoveredLayer]
  );

  if (!baselineExperiment || !comparisonExperiment) return null;

  const ckaData = getCkaData(dataset, baselineExperiment, comparisonExperiment);
  const layers = ckaData.map((data) => data.layer);

  return (
    <div className="relative">
      <style>{LINE_CHART_TICK_STYLE}</style>
      <CustomLegend />
      <ChartContainer
        className="w-[454px] h-[228px] relative"
        config={LINE_CHART_CONFIG}
      >
        <LineChart
          accessibilityLayer
          data={ckaData}
          margin={{
            top: 20,
            right: 7,
            bottom: 14,
            left: -14,
          }}
          onMouseMove={(state: any) => {
            if (state?.activePayload) {
              setHoveredLayer(state.activePayload[0].payload.layer);
            }
          }}
          onMouseLeave={() => setHoveredLayer(null)}
        >
          <CartesianGrid stroke={COLORS.GRID_COLOR} />
          <XAxis
            dataKey="layer"
            tickLine={false}
            axisLine={{ stroke: COLORS.BLACK }}
            tickMargin={-2}
            angle={-45}
            tick={renderTick}
            ticks={layers}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: COLORS.BLACK }}
            domain={[0, 1]}
            interval={0}
            tick={{
              fontSize: FONT_CONFIG.FONT_SIZE_10,
              fontWeight: FONT_CONFIG.LIGHT_FONT_WEIGHT,
            }}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
            tickMargin={-2}
            label={{
              value: "CKA (Before vs. After Unlearning)",
              angle: -90,
              position: "center",
              style: {
                fontSize: 12,
                fill: COLORS.BLACK,
              },
            }}
          />
          <Tooltip
            cursor={false}
            content={<CustomTooltip />}
            wrapperStyle={{ zIndex: CONFIG.zIndex }}
          />
          {CKA_DATA_KEYS.map((key, idx) => {
            const isBaselineLine = key.includes("baseline");
            const dotColor = isBaselineLine ? COLORS.EMERALD : COLORS.PURPLE;
            const isForgetLine = key.includes("Forget");
            const dotSize = isForgetLine ? CONFIG.CROSS_SIZE : CONFIG.DOT_SIZE;
            const activeDotStyle = {
              stroke: COLORS.BLACK,
              strokeWidth: isForgetLine
                ? CONFIG.ACTIVE_CROSS_STROKE_WIDTH
                : CONFIG.ACTIVE_DOT_STROKE_WIDTH,
            };

            return (
              <Line
                key={idx}
                dataKey={key}
                type="linear"
                stroke={
                  LINE_CHART_CONFIG[key as keyof typeof LINE_CHART_CONFIG].color
                }
                strokeWidth={STROKE_CONFIG.DEFAULT_STROKE_WIDTH}
                strokeDasharray={
                  isBaselineLine ? undefined : STROKE_CONFIG.STROKE_DASHARRAY
                }
                animationDuration={ANIMATION_DURATION}
                dot={({ cx, cy }) =>
                  isForgetLine ? (
                    <FatMultiplicationSignIcon
                      x={cx - dotSize / 2}
                      y={cy - dotSize / 2}
                      width={dotSize}
                      height={dotSize}
                      color={dotColor}
                    />
                  ) : (
                    <CircleIcon
                      x={cx - dotSize / 2}
                      y={cy - dotSize / 2}
                      width={dotSize}
                      height={dotSize}
                      color={dotColor}
                    />
                  )
                }
                activeDot={(props: any) =>
                  isForgetLine ? (
                    <FatMultiplicationSignIcon
                      x={props.cx - dotSize / 2}
                      y={props.cy - dotSize / 2}
                      width={dotSize}
                      height={dotSize}
                      color={dotColor}
                      style={activeDotStyle}
                    />
                  ) : (
                    <CircleIcon
                      x={props.cx - dotSize / 2}
                      y={props.cy - dotSize / 2}
                      width={dotSize}
                      height={dotSize}
                      color={dotColor}
                      style={activeDotStyle}
                    />
                  )
                }
              />
            );
          })}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{ zIndex: CONFIG.zIndex }}
        className="rounded-lg border border-border/50 bg-white px-2 py-1 text-sm shadow-xl"
      >
        <div className="flex items-center leading-[18px]">
          <CircleIcon
            className="w-3 h-3 mr-1"
            style={{ color: COLORS.EMERALD }}
          />
          <p>
            <span style={{ color: COLORS.EMERALD }}>Model A </span>(Remain):{" "}
            <span className="font-semibold">{payload[1].value}</span>
          </p>
        </div>
        <div className="flex items-center leading-[18px]">
          <CircleIcon className="w-3 h-3 mr-1" color={COLORS.PURPLE} />
          <p>
            <span style={{ color: COLORS.PURPLE }}>Model B </span>(Remain):{" "}
            <span className="font-semibold">{payload[3].value}</span>
          </p>
        </div>
        <div className="flex items-center leading-[18px]">
          <FatMultiplicationSignIcon
            className="w-4 h-4 -ml-0.5 mr-0.5"
            style={{ color: COLORS.EMERALD }}
          />
          <p>
            <span style={{ color: COLORS.EMERALD }}>Model A </span>(Forget):{" "}
            <span className="font-semibold">{payload[0].value}</span>
          </p>
        </div>
        <div className="flex items-center leading-[18px]">
          <FatMultiplicationSignIcon
            className="w-4 h-4 -ml-0.5 mr-0.5"
            color={COLORS.PURPLE}
          />
          <p>
            <span style={{ color: COLORS.PURPLE }}>Model B </span>(Forget):{" "}
            <span className="font-semibold">{payload[2].value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function CustomLegend() {
  const CIRCLE = "circle";
  const CROSS = "cross";

  return (
    <div className="absolute bottom-[52px] left-[60px] text-xs leading-4 z-10">
      {[
        {
          type: CIRCLE,
          color: COLORS.EMERALD,
          label: "Model A",
          text: "(Remain Classes)",
          spacing: "py-0.5",
        },
        {
          type: CIRCLE,
          color: COLORS.PURPLE,
          label: "Model B",
          text: "(Remain Classes)",
          spacing: "py-0.5",
        },
        {
          type: CROSS,
          color: COLORS.EMERALD,
          label: "Model A",
          text: "(Forget Class)",
          spacing: "py-0.5",
        },
        {
          type: CROSS,
          color: COLORS.PURPLE,
          label: "Model B",
          text: "(Forget Class)",
          spacing: "py-0.5",
        },
      ].map((item, i) => {
        const Icon =
          item.type === CIRCLE ? CircleIcon : FatMultiplicationSignIcon;
        return (
          <div key={i} className={`flex items-center ${item.spacing}`}>
            <div className="relative">
              <Icon
                className={`z-10 ${
                  item.type === CIRCLE ? "mr-2" : "relative right-[1px]"
                }`}
                style={{
                  color: item.color,
                  width:
                    item.type === CIRCLE ? CONFIG.DOT_SIZE : CONFIG.CROSS_SIZE,
                  height:
                    item.type === CIRCLE ? CONFIG.DOT_SIZE : CONFIG.CROSS_SIZE,
                }}
              />
              <div
                className="absolute top-1/2 w-[18px] h-[1px]"
                style={{
                  transform: "translate(-4px, -50%)",
                  ...(i % 2 === 1
                    ? { borderTop: `1px dashed ${COLORS.PURPLE}` }
                    : { backgroundColor: item.color }),
                }}
              />
            </div>
            <span style={i > 1 ? { marginLeft: "6px" } : undefined}>
              <span style={{ color: item.color }}>{item.label}</span>{" "}
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
