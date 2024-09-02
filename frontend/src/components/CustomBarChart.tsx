import { useMemo, useContext, useEffect, useRef } from "react";
import * as d3 from "d3";

import { BaselineContext } from "../store/baseline-context";

interface Props {
  data: { [key: string]: any } | undefined;
  dataKey: "training" | "test";
  color: string;
}

export default function CustomBarChart({ data, dataKey, color }: Props) {
  const { baseline } = useContext(BaselineContext);
  const chartRef = useRef<SVGSVGElement | null>(null);

  const chartData = useMemo(() => {
    if (!data) return [];

    const newChartData = Object.entries(data).map(([key, value]) => ({
      class: key,
      accuracy: parseFloat(value as string),
    }));

    return newChartData;
  }, [data]);

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const margin = { top: 5, right: 0, bottom: 5, left: 20 };
    const width = 200 - margin.left - margin.right;
    const height = 105 - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .domain(chartData.map((d) => d.class))
      .range([0, width])
      .padding(0.5);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.accuracy)!])
      .nice()
      .range([height, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(6));

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(6));

    g.selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.class)!)
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0) // 초기 높이를 0으로 설정
      .attr("fill", (d, i) => d3.schemeTableau10[i % 10]) // 각 바에 색상 할당
      .transition() // 트랜지션 추가
      .duration(800) // 애니메이션 지속 시간 설정
      .attr("y", (d) => y(d.accuracy)) // 최종 y 위치 설정
      .attr("height", (d) => height - y(d.accuracy)); // 최종 높이 설정
  }, [chartData, color, data, baseline]);

  if (!data) return null;

  return (
    <div>
      <svg ref={chartRef} width={200} height={120}></svg>
    </div>
  );
}
