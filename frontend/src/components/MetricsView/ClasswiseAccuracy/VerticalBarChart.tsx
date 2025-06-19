import { useMemo, useCallback, memo } from "react";
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

import { TABLEAU10 } from "../../../constants/colors";
import { type ChartConfig } from "../../UI/chart";
import { COLORS } from "../../../constants/colors";
import { ChartContainer } from "../../UI/chart";
import { GapDataItem } from "../../../types/data";
import { useClasses } from "../../../hooks/useClasses";
import { useForgetClassStore } from "../../../stores/forgetClassStore";
import { useModelDataStore } from "../../../stores/modelDataStore";
import { FONT_CONFIG, STROKE_CONFIG } from "../../../constants/common";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../../hooks/useModelExperiment";

const CONFIG = {
  TOOLTIP_TO_FIXED_LENGTH: 3,
  BAR_HEIGHT: 13,
} as const;

interface Props {
  mode: "Training" | "Test";
  gapData: GapDataItem[];
  maxGap: number;
  hoveredClass: string | null;
  onHoverChange: (value: string | null) => void;
  showYAxis?: boolean;
}

export default function VerticalBarChart({
  mode,
  gapData,
  maxGap,
  hoveredClass,
  onHoverChange,
  showYAxis = true,
}: Props) {
  const classes = useClasses();
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const forgettingClass = classes[forgetClass];
  const VERTICAL_BAR_CHART_CONFIG = (() => {
    const config: Record<string, any> = {
      value: {
        label: "Gap",
      },
    };
    classes.forEach((label, index) => {
      const key = String.fromCharCode(65 + index);
      config[key] = {
        label,
        color: TABLEAU10[index],
      };
    });
    return config;
  })() satisfies ChartConfig;

  const renderTick = useCallback(
    (props: any) => (
      <AxisTick
        {...props}
        classes={classes}
        hoveredClass={hoveredClass}
        forgetClass={forgetClass}
        chartrConfig={VERTICAL_BAR_CHART_CONFIG}
      />
    ),
    [VERTICAL_BAR_CHART_CONFIG, classes, forgetClass, hoveredClass]
  );

  const remainGapAvgValue = useMemo(() => {
    const remainingData = gapData.filter(
      (datum) => classes[+datum.classLabel] !== forgettingClass
    );

    return remainingData.length
      ? remainingData.reduce((sum, datum) => sum + datum.gap, 0) /
          remainingData.length
      : 0;
  }, [classes, forgettingClass, gapData]);

  const remainGapAvg = remainGapAvgValue.toFixed(
    CONFIG.TOOLTIP_TO_FIXED_LENGTH
  );

  return (
    <div className="flex flex-col justify-center items-center relative bottom-1.5 right-2.5">
      <span
        className={`text-[15px] relative ${
          mode === "Training" ? "left-7" : "left-0"
        }`}
      >
        {mode} Dataset
      </span>
      <ChartContainer
        config={VERTICAL_BAR_CHART_CONFIG}
        className={`${showYAxis ? "w-[260px]" : "w-[210px]"} h-[252px]`}
      >
        <BarChart
          accessibilityLayer
          data={gapData}
          layout="vertical"
          margin={{
            left: 4,
            right: 8,
            top: 12,
            bottom: 18,
          }}
          onMouseMove={(state: any) => {
            if (state?.activePayload) {
              onHoverChange(state.activePayload[0].payload.category);
            }
          }}
          onMouseLeave={() => onHoverChange(null)}
        >
          <YAxis
            limitingConeAngle={30}
            dataKey="category"
            type="category"
            tickLine={false}
            axisLine={{ stroke: COLORS.BLACK }}
            interval={0}
            fontSize={FONT_CONFIG.FONT_SIZE_10}
            fontWeight={FONT_CONFIG.LIGHT_FONT_WEIGHT}
            tick={showYAxis ? renderTick : false}
            width={showYAxis ? 62 : 10}
            tickMargin={-1}
            tickFormatter={(value) => {
              const label =
                VERTICAL_BAR_CHART_CONFIG[
                  value as keyof typeof VERTICAL_BAR_CHART_CONFIG
                ]?.label;
              const isForgetClass = label === forgettingClass;
              return isForgetClass ? `${label} (\u2716)` : label;
            }}
            style={{ whiteSpace: "nowrap" }}
          />
          <XAxis
            dataKey="value"
            type="number"
            axisLine={{ stroke: COLORS.BLACK }}
            domain={[-maxGap, maxGap]}
            tickFormatter={(value) => value.toString()}
            fontSize={FONT_CONFIG.FONT_SIZE_10}
            ticks={[-maxGap, 0, maxGap]}
          >
            <Label
              content={(props) => {
                const {
                  x = 0,
                  y = 0,
                  width = 0,
                } = (
                  props as {
                    viewBox?: { x?: number; y?: number; width?: number };
                  }
                ).viewBox || {};

                const modelAType = modelAExperiment?.Type;
                const modelBType = modelBExperiment?.Type;
                let lowerTextDx =
                  x +
                  width / 2 +
                  (modelAType === "Original"
                    ? 5.5
                    : modelAType === "Retrained"
                    ? 2
                    : 0);

                return (
                  <g className="flex flex-col items-center justify-center">
                    <text
                      x={x + width / 2}
                      y={y + 32}
                      textAnchor="middle"
                      fill={COLORS.BLACK}
                      className="text-[13px]"
                    >
                      {"← "}
                      <tspan fill={COLORS.EMERALD}>Model A</tspan>
                      {" High | "}
                      <tspan fill={COLORS.PURPLE}>Model B</tspan>
                      {" High →"}
                    </text>
                    <text
                      x={lowerTextDx}
                      y={y + 46}
                      textAnchor="middle"
                      fill={COLORS.BLACK}
                      className="text-[13px]"
                    >
                      <tspan fill={COLORS.EMERALD}>
                        ({modelAType}, {modelA})
                      </tspan>
                      <tspan fill={COLORS.PURPLE} dx="3">
                        ({modelBType}, {modelB})
                      </tspan>
                    </text>
                  </g>
                );
              }}
              position="bottom"
            />
          </XAxis>
          <ReferenceLine x={0} stroke={COLORS.GRAY} />
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <Bar dataKey="gap" layout="vertical" barSize={CONFIG.BAR_HEIGHT} />
          <ReferenceLine
            x={remainGapAvg}
            stroke={COLORS.GRAY}
            strokeDasharray={STROKE_CONFIG.STROKE_DASHARRAY}
            label={{
              value: `avg (retain): ${remainGapAvg}`,
              position: "top",
              fontSize: FONT_CONFIG.FONT_SIZE_10,
              fill: COLORS.BLACK,
              offset: 3.5,
            }}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as GapDataItem;

    return (
      <div className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-sm shadow-xl">
        <p>
          <span style={{ color: COLORS.EMERALD }}>Model A</span>
          <span> Acc: </span>
          <span className="font-semibold">
            {data.modelAAccuracy.toFixed(CONFIG.TOOLTIP_TO_FIXED_LENGTH)}
          </span>
        </p>
        <p>
          <span style={{ color: COLORS.PURPLE }}>Model B</span>
          <span> Acc: </span>
          <span className="font-semibold">
            {data.modelBAccuracy.toFixed(CONFIG.TOOLTIP_TO_FIXED_LENGTH)}
          </span>
        </p>
        <p>
          Difference:{" "}
          <span className="font-semibold">
            {data.gap.toFixed(CONFIG.TOOLTIP_TO_FIXED_LENGTH)}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

type TickProps = {
  x: number;
  y: number;
  payload: any;
  classes: string[];
  hoveredClass: string | null;
  forgetClass: number;
  chartrConfig: Record<string, any>;
};

const AxisTick = memo(
  ({
    x,
    y,
    payload,
    classes,
    hoveredClass,
    forgetClass,
    chartrConfig,
  }: TickProps) => {
    const label =
      chartrConfig[payload.value as keyof typeof chartrConfig]?.label;
    const isForgetClass = label === classes[forgetClass];
    const formattedLabel = isForgetClass ? `${label}\u00A0(\u2716)` : label;

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fontSize={FONT_CONFIG.FONT_SIZE_10}
        fontWeight={
          hoveredClass === payload.value
            ? "bold"
            : FONT_CONFIG.LIGHT_FONT_WEIGHT
        }
      >
        {formattedLabel}
      </text>
    );
  }
);
