import { useMemo } from "react";
import * as d3 from "d3";
import { SelectedData } from "../views/Embeddings";

interface ScaleResult {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  z: d3.ScaleOrdinal<number, string>;
}

export const useScatterPlotScales = (
  data: SelectedData,
  width: number,
  height: number,
  paddingRatio: number
): ScaleResult => {
  const x = useMemo(() => {
    if (data.length === 0) {
      return d3.scaleLinear().domain([0, 1]).range([0, width]);
    }

    return d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[0] as number) as [number, number])
      .nice()
      .range([0, width]);
  }, [data, width]);

  const y = useMemo(() => {
    if (data.length === 0) {
      return d3.scaleLinear().domain([0, 1]).range([height, 0]);
    }

    const [min, max] = d3.extent(data, (d) => d[1] as number) as [
      number,
      number
    ];
    const padding = (max - min) * paddingRatio;

    return d3
      .scaleLinear()
      .domain([min - padding, max + padding])
      .nice()
      .range([height, 0]);
  }, [data, height, paddingRatio]);

  const z = useMemo(
    () =>
      d3
        .scaleOrdinal<number, string>()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        .range(d3.schemeTableau10),
    []
  );

  return { x, y, z };
};
