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

import {
  CIFAR_10_CLASSES,
  FONT_CONFIG,
  STROKE_CONFIG,
} from "../../constants/common";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../stores/experimentsStore";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { useModelDataStore } from "../../stores/modelDataStore";
import { COLORS } from "../../constants/colors";
import { VERTICAL_BAR_CHART_CONFIG } from "../../constants/accuracies";
import { ChartContainer } from "../UI/chart";

const CONFIG = {
  TOOLTIP_TO_FIXED_LENGTH: 3,
  BAR_HEIGHT: 12,
} as const;

export interface GapDataItem {
  category: string;
  classLabel: string;
  gap: number;
  fill: string;
  baselineAccuracy: number;
  comparisonAccuracy: number;
}

interface Props {
  mode: "Training" | "Test";
  gapData: GapDataItem[];
  maxGap: number;
  showYAxis?: boolean;
  hoveredClass: string | null;
  onHoverChange: (value: string | null) => void;
}

export default function VerticalBarChart({
  mode,
  gapData,
  maxGap,
  showYAxis = true,
  hoveredClass,
  onHoverChange,
}: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const modelA = useModelDataStore((state) => state.modelA);
  const modelB = useModelDataStore((state) => state.modelB);
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const forgettingCIFAR10Class = CIFAR_10_CLASSES[forgetClass];

  const renderTick = useCallback(
    (props: any) => (
      <AxisTick
        {...props}
        hoveredClass={hoveredClass}
        forgetClass={forgetClass}
      />
    ),
    [forgetClass, hoveredClass]
  );

  const remainGapAvgValue = useMemo(() => {
    const remainingData = gapData.filter(
      (datum) => CIFAR_10_CLASSES[+datum.classLabel] !== forgettingCIFAR10Class
    );

    return remainingData.length
      ? remainingData.reduce((sum, datum) => sum + datum.gap, 0) /
          remainingData.length
      : 0;
  }, [forgettingCIFAR10Class, gapData]);

  const remainGapAvg = remainGapAvgValue.toFixed(
    CONFIG.TOOLTIP_TO_FIXED_LENGTH
  );

  return (
    <div className="flex flex-col justify-center items-center relative bottom-1.5">
      <span
        className={`text-[15px] relative ${
          mode === "Training" ? "left-[30px]" : "left-0"
        }`}
      >
        {mode} Dataset
      </span>
      <ChartContainer
        config={VERTICAL_BAR_CHART_CONFIG}
        className={`${showYAxis ? "w-[255px]" : "w-[195px]"} h-[272px]`}
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
            width={showYAxis ? 60 : 1}
            tickMargin={-1}
            tickFormatter={(value) => {
              const label =
                VERTICAL_BAR_CHART_CONFIG[
                  value as keyof typeof VERTICAL_BAR_CHART_CONFIG
                ]?.label;
              const isForgetClass = label === forgettingCIFAR10Class;
              return isForgetClass ? `${label}\u00A0(X)` : label;
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
                      y={y + 28}
                      textAnchor="middle"
                      fill={COLORS.BLACK}
                      className="text-xs"
                    >
                      {"← "}
                      <tspan fill={COLORS.EMERALD}>Model A</tspan>
                      {" High | "}
                      <tspan fill={COLORS.PURPLE}>Model B</tspan>
                      {" High →"}
                    </text>
                    <text
                      x={lowerTextDx}
                      y={y + 42}
                      textAnchor="middle"
                      fill={COLORS.BLACK}
                      className="text-xs"
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
              value: `mean (retain): ${remainGapAvg}`,
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
      <div className="rounded-lg border border-border/50 bg-white px-2 py-1 text-sm shadow-xl">
        <p>
          <span style={{ color: COLORS.EMERALD }}>Model A: </span>
          <span className="font-semibold">
            {data.baselineAccuracy.toFixed(CONFIG.TOOLTIP_TO_FIXED_LENGTH)}
          </span>
        </p>
        <p>
          <span style={{ color: COLORS.PURPLE }}>Model B: </span>
          <span className="font-semibold">
            {data.comparisonAccuracy.toFixed(CONFIG.TOOLTIP_TO_FIXED_LENGTH)}
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
  hoveredClass: string | null;
  forgetClass: number;
};

const AxisTick = memo(
  ({ x, y, payload, hoveredClass, forgetClass }: TickProps) => {
    const label =
      VERTICAL_BAR_CHART_CONFIG[
        payload.value as keyof typeof VERTICAL_BAR_CHART_CONFIG
      ]?.label;
    const isForgetClass = label === CIFAR_10_CLASSES[forgetClass];
    const formattedLabel = isForgetClass ? `${label}\u00A0(X)` : label;

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
