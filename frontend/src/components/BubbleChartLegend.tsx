import * as d3 from "d3";

const RECT_HEIGHT = 190;

export default function BubbleChartLegend() {
  const colorScale = d3
    .scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateViridis);

  const legendWidth = 35;
  const legendHeight = 254;
  const tickCount = 6;
  const ticks = d3.range(0, tickCount).map((d) => 1 - d / (tickCount - 1));

  const circleTicks = [2, 25, 80];
  const diameter = 25;
  const dashWidth = 12;
  const scale = (value: number) => Math.sqrt(value) * 0.8;

  const allCircles = circleTicks.map((tick, i) => {
    const xCenter = diameter / 2 + 1.5;
    const yCircleTop = 18 - 2 * scale(tick);
    const yCircleCenter = yCircleTop + scale(tick);

    return (
      <g key={i}>
        <circle
          cx={xCenter}
          cy={yCircleCenter}
          r={scale(tick)}
          fill="none"
          stroke="black"
        />
        <line
          x1={xCenter}
          x2={xCenter + dashWidth}
          y1={yCircleTop}
          y2={yCircleTop}
          stroke="black"
          strokeDasharray={"2,2"}
        />
        <text
          x={xCenter + dashWidth}
          y={yCircleTop}
          fontSize={6}
          alignmentBaseline="middle"
        >
          {(i * 0.5).toFixed(1)}
        </text>
      </g>
    );
  });

  return (
    <svg
      className="z-50 absolute right-0"
      width={legendWidth}
      height={legendHeight}
    >
      {allCircles}
      <defs>
        <linearGradient id="colorGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          {d3.range(0, 1.01, 0.01).map((t, i) => (
            <stop key={i} offset={`${t * 100}%`} stopColor={colorScale(t)} />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={10}
        y={24}
        width={8}
        height={RECT_HEIGHT}
        fill="url(#colorGradient)"
      />
      {ticks.map((tick, i) => (
        <g key={i}>
          <line
            x1={18}
            y1={24 + tick * RECT_HEIGHT}
            x2={22}
            y2={24 + tick * RECT_HEIGHT}
            stroke="black"
            strokeWidth={1}
          />
          <text
            x={24}
            y={24 + tick * RECT_HEIGHT}
            fontSize={8}
            dominantBaseline="middle"
          >
            {(1 - tick).toFixed(1)}
          </text>
        </g>
      ))}
    </svg>
  );
}
