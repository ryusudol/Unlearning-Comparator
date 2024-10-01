import * as d3 from "d3";

type BubbleLegendProps = {
  scale: d3.ScaleLinear<number, number, never>;
};

export default function BubbleLegend({ scale }: BubbleLegendProps) {
  const ticks = [1.5, 15, 50];
  const diameter = 25;
  const dashWidth = 15;

  const allCircles = ticks.map((tick, i) => {
    const xCenter = diameter / 2;
    const yCircleTop = diameter - 2 * scale(tick);
    const yCircleCenter = scale(tick);

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
          y1={yCircleTop - 5}
          y2={yCircleTop - 5}
          stroke="black"
          strokeDasharray={"2,2"}
        />
        <text
          x={xCenter + dashWidth}
          y={yCircleTop - 5}
          fontSize={6}
          alignmentBaseline="middle"
        >
          {ticks[ticks.length - i - 1] * 10}
        </text>
      </g>
    );
  });

  return (
    <svg width={diameter} height={diameter} overflow="visible" className="">
      {allCircles}
    </svg>
  );
}
