import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface ConnectionLineProps {
  startPoint: { x: number; y: number } | null;
  endPoint: { x: number; y: number } | null;
  baselineChartWidth: number;
  separatorWidth: number;
}

const ConnectionLine = ({
  startPoint,
  endPoint,
  baselineChartWidth,
  separatorWidth,
}: ConnectionLineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Component mount debug
  useEffect(() => {
    console.log("ConnectionLine mounted");
    return () => console.log("ConnectionLine unmounted");
  }, []);

  // Props change debug
  useEffect(() => {
    console.log("ConnectionLine props updated:", {
      startPoint,
      endPoint,
      baselineChartWidth,
      separatorWidth,
    });
  }, [startPoint, endPoint, baselineChartWidth, separatorWidth]);

  useEffect(() => {
    console.log("Attempting to draw connection line");
    console.log("SVG ref exists:", !!svgRef.current);

    if (!svgRef.current) {
      console.log("No SVG ref");
      return;
    }

    if (!startPoint || !endPoint) {
      console.log("Missing points:", { startPoint, endPoint });
      return;
    }

    console.log("Drawing connection line with points:", {
      start: startPoint,
      end: endPoint,
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Add debug rectangle to show SVG boundaries
    svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1)
      .style("opacity", 0.2);

    // Calculate the path
    const controlPoint1X = startPoint.x + baselineChartWidth / 3;
    const controlPoint2X = endPoint.x - baselineChartWidth / 3;

    const path = d3.path();
    path.moveTo(startPoint.x, startPoint.y);
    path.bezierCurveTo(
      controlPoint1X,
      startPoint.y,
      controlPoint2X,
      endPoint.y,
      endPoint.x,
      endPoint.y
    );

    // Draw the connection line
    svg
      .append("path")
      .attr("d", path.toString())
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .style("opacity", 1);

    // Draw debug points
    const points = [
      { x: startPoint.x, y: startPoint.y, color: "red" },
      { x: controlPoint1X, y: startPoint.y, color: "green" },
      { x: controlPoint2X, y: endPoint.y, color: "green" },
      { x: endPoint.x, y: endPoint.y, color: "blue" },
    ];

    points.forEach((point) => {
      svg
        .append("circle")
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("r", 4)
        .attr("fill", point.color)
        .style("opacity", 0.7);
    });
  }, [startPoint, endPoint, baselineChartWidth, separatorWidth]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
        border: "1px solid green", // Debug border
        opacity: 1,
      }}
    >
      <svg
        ref={svgRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      />
      {/* Debug info overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: "rgba(255,255,255,0.8)",
          padding: "5px",
          fontSize: "12px",
          zIndex: 1001,
        }}
      >
        ConnectionLine Active
      </div>
    </div>
  );
};

export default ConnectionLine;
