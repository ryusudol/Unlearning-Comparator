import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { EpochMetrics } from "../../../types/data";
import { COLORS } from "../../../constants/colors";
import { CircleIcon, FatMultiplicationSignIcon } from "../../common/icons";
import {
  ANIMATION_DURATION,
  FONT_CONFIG,
  STROKE_CONFIG,
} from "../../../constants/common";

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={10}
    height={10}
    color={"#000000"}
    fill={"none"}
    {...props}
  >
    <path
      d="M12 1.75C12.311 1.75 12.5898 1.94201 12.7007 2.23263L15.0587 8.41234L21.5366 8.72913C21.8418 8.74406 22.1074 8.94263 22.2081 9.23111C22.3088 9.5196 22.2244 9.84032 21.9947 10.0419L17.0648 14.3695L18.8767 21.3106C18.9558 21.6135 18.8383 21.9338 18.5821 22.1137C18.3258 22.2937 17.9848 22.2956 17.7266 22.1183L12 18.1875L6.27335 22.1183C6.01519 22.2956 5.67409 22.2937 5.41785 22.1137C5.1616 21.9338 5.04413 21.6135 5.12323 21.3106L6.93517 14.3695L2.0052 10.0419C1.77557 9.84032 1.69118 9.5196 1.79186 9.23111C1.89253 8.94263 2.15815 8.74406 2.46334 8.72913L8.94127 8.41234L11.2992 2.23263C11.4101 1.94201 11.6889 1.75 12 1.75Z"
      fill="currentColor"
    />
  </svg>
);

const CONFIG = {
  WIDTH: 445,
  HEIGHT: 230,
  MARGIN: { top: 8, right: 7, bottom: -10, left: -40 },
  STROKE_WIDTH: 2,
  DOT_SIZE: 10,
  CROSS_SIZE: 13,
  STAR_SIZE: 12,
  ACTIVE_DOT_STROKE_WIDTH: 3,
  ACTIVE_CROSS_STROKE_WIDTH: 2,
  DASH_DOT_PATTERN: "8 3 2 3",
} as const;

const METRIC_COLORS = {
  UA: "#2A6218", // Dark green
  RA: "#2A6218", // Dark green (same as UA)
  TUA: "#67CA4D", // Light green
  TRA: "#67CA4D", // Light green (same as TUA)
  PS: "#D54B04", // Orange/red
} as const;

// Render order: light green first (bottom), then dark green (top), then PS
const RENDER_ORDER = ["TUA", "TRA", "UA", "RA", "PS"] as const;

const LEGEND_DATA = [
  {
    color: "#2A6218",
    fullName: "UA (Unlearn Accuracy)",
    icon: "cross",
    lineStyle: "dashed",
  },
  {
    color: "#67CA4D",
    fullName: "TUA (Test Unlearn Accuracy)",
    icon: "cross",
    lineStyle: "dashed",
  },
  {
    color: "#2A6218",
    fullName: "RA (Remain Accuracy)",
    icon: "circle",
    lineStyle: "solid",
  },
  {
    color: "#67CA4D",
    fullName: "TRA (Test Remain Accuracy)",
    icon: "circle",
    lineStyle: "solid",
  },
  {
    color: "#D54B04",
    fullName: "PS (Privacy Score)",
    icon: "star",
    lineStyle: "dash-dot",
  },
] as const;

interface Props {
  epochMetrics: EpochMetrics;
  experimentId: string;
}

interface ChartDataPoint {
  epoch: number;
  UA: number;
  RA: number;
  TUA: number;
  TRA: number;
  PS: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-2 py-1.5 border border-gray-200 shadow-lg rounded text-sm">
        {LEGEND_DATA.map(({ fullName }, index) => {
          const metricKey = fullName.split(" ")[0]; // "UA", "TUA", "RA", "TRA", "PS" 추출
          const entry = payload.find((p: any) => p.dataKey === metricKey);

          if (!entry) return null;

          return (
            <p key={index} className="mb-0.5">
              <span style={{ color: entry.color }}>{entry.dataKey}</span>
              <span style={{ color: "#000000" }}>: </span>
              <span className="font-semibold" style={{ color: "#000000" }}>
                {entry.value.toFixed(3)}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function EpochMetricsTooltip({
  epochMetrics,
  experimentId,
}: Props) {
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const maxLength = Math.max(
      epochMetrics.UA.length,
      epochMetrics.RA.length,
      epochMetrics.TUA.length,
      epochMetrics.TRA.length,
      epochMetrics.PS.length
    );

    // If 20 or fewer epochs, show all data points
    if (maxLength <= 20) {
      for (let i = 0; i < maxLength; i++) {
        data.push({
          epoch: i,
          UA: epochMetrics.UA[i] || 0,
          RA: epochMetrics.RA[i] || 0,
          TUA: epochMetrics.TUA[i] || 0,
          TRA: epochMetrics.TRA[i] || 0,
          PS: epochMetrics.PS[i] || 0,
        });
      }
    } else {
      // If more than 20 epochs, sample 20 points evenly
      const step = Math.floor(maxLength / 20);
      for (let i = 0; i < 20; i++) {
        const epochIndex = i * step;
        data.push({
          epoch: epochIndex,
          UA: epochMetrics.UA[epochIndex] || 0,
          RA: epochMetrics.RA[epochIndex] || 0,
          TUA: epochMetrics.TUA[epochIndex] || 0,
          TRA: epochMetrics.TRA[epochIndex] || 0,
          PS: epochMetrics.PS[epochIndex] || 0,
        });
      }
    }

    return data;
  }, [epochMetrics]);

  const epochs = useMemo(() => {
    return chartData.map((d) => d.epoch);
  }, [chartData]);

  return (
    <div className="bg-white border border-gray-200 shadow-xl rounded px-3 py-2 z-50">
      <h3 className="text-[15px] text-gray-800 text-center mb-1">
        Epoch-wise Unlearning Metrics ({experimentId})
      </h3>
      <div className="relative">
        <LineChart
          width={CONFIG.WIDTH}
          height={CONFIG.HEIGHT}
          data={chartData}
          margin={CONFIG.MARGIN}
        >
          <CartesianGrid stroke={COLORS.GRID_COLOR} />
          <XAxis
            dataKey="epoch"
            tickLine={false}
            axisLine={{ stroke: COLORS.BLACK }}
            tickMargin={2}
            interval={0}
            ticks={epochs}
            tick={{
              fontSize: FONT_CONFIG.FONT_SIZE_10,
              fontWeight: FONT_CONFIG.LIGHT_FONT_WEIGHT,
            }}
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
            tickMargin={1}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={false}
            wrapperStyle={{ zIndex: 50 }}
          />
          {RENDER_ORDER.map((metric) => {
            const color = METRIC_COLORS[metric];
            const isDashed = metric === "UA" || metric === "TUA";
            const isCross = metric === "UA" || metric === "TUA";
            const isStar = metric === "PS";
            const dotSize = isCross
              ? CONFIG.CROSS_SIZE
              : isStar
              ? CONFIG.STAR_SIZE
              : CONFIG.DOT_SIZE;
            const activeDotStyle = {
              stroke: "#000000",
              strokeWidth: isCross
                ? CONFIG.ACTIVE_CROSS_STROKE_WIDTH
                : CONFIG.ACTIVE_DOT_STROKE_WIDTH,
            };

            return (
              <Line
                key={metric}
                type="linear"
                dataKey={metric}
                stroke={color}
                strokeWidth={CONFIG.STROKE_WIDTH}
                strokeDasharray={
                  isDashed
                    ? STROKE_CONFIG.STROKE_DASHARRAY
                    : isStar
                    ? CONFIG.DASH_DOT_PATTERN
                    : undefined
                }
                dot={({ cx, cy }) => {
                  if (isCross) {
                    return (
                      <FatMultiplicationSignIcon
                        x={cx - dotSize / 2}
                        y={cy - dotSize / 2}
                        width={dotSize}
                        height={dotSize}
                        style={{ color }}
                      />
                    );
                  } else if (isStar) {
                    return (
                      <StarIcon
                        x={cx - dotSize / 2}
                        y={cy - dotSize / 2}
                        width={dotSize}
                        height={dotSize}
                        style={{ color }}
                      />
                    );
                  } else {
                    return (
                      <CircleIcon
                        x={cx - dotSize / 2}
                        y={cy - dotSize / 2}
                        width={dotSize}
                        height={dotSize}
                        style={{ color }}
                      />
                    );
                  }
                }}
                activeDot={(props: any) => {
                  if (isCross) {
                    return (
                      <FatMultiplicationSignIcon
                        x={props.cx - dotSize / 2}
                        y={props.cy - dotSize / 2}
                        width={dotSize}
                        height={dotSize}
                        style={{ color, ...activeDotStyle }}
                      />
                    );
                  } else if (isStar) {
                    return (
                      <StarIcon
                        x={props.cx - dotSize / 2}
                        y={props.cy - dotSize / 2}
                        width={dotSize}
                        height={dotSize}
                        style={{ color, ...activeDotStyle }}
                      />
                    );
                  } else {
                    return (
                      <CircleIcon
                        x={props.cx - dotSize / 2}
                        y={props.cy - dotSize / 2}
                        width={dotSize}
                        height={dotSize}
                        style={{ color, ...activeDotStyle }}
                      />
                    );
                  }
                }}
                animationDuration={ANIMATION_DURATION}
              />
            );
          })}
        </LineChart>
        <div className="absolute right-3.5 bottom-8 text-xs leading-4 z-10 border-2 border-[#EFEFEF] rounded-[4px] pl-2.5 pr-1.5 py-0.5 bg-white/60">
          {LEGEND_DATA.map(({ color, fullName, icon, lineStyle }, idx) => (
            <div key={idx} className="flex items-center py-0.5">
              <div className="relative mr-2">
                {icon === "cross" && (
                  <FatMultiplicationSignIcon
                    width={10}
                    height={10}
                    style={{ color }}
                  />
                )}
                {icon === "circle" && (
                  <CircleIcon width={10} height={10} style={{ color }} />
                )}
                {icon === "star" && (
                  <StarIcon width={12} height={12} style={{ color }} />
                )}
                {lineStyle === "dash-dot" ? (
                  <svg
                    className="absolute top-1/2"
                    style={{ transform: "translate(-4px, -50%)" }}
                    width="18"
                    height="2"
                  >
                    <line
                      x1="0"
                      y1="1"
                      x2="18"
                      y2="1"
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray={CONFIG.DASH_DOT_PATTERN}
                    />
                  </svg>
                ) : (
                  <div
                    className="absolute top-1/2 w-[18px] h-[1px]"
                    style={{
                      transform: "translate(-4px, -50%)",
                      backgroundColor:
                        lineStyle === "solid" ? color : "transparent",
                      ...(lineStyle === "dashed" && {
                        borderTop: `2px dashed ${color}`,
                      }),
                    }}
                  />
                )}
              </div>
              <span className="text-black text-xs">{fullName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
