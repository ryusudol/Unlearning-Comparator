import * as d3 from "d3";

import { Dist, Point } from "../../types/data";
import { Experiment, Experiments } from "../../types/experiments-context";
import { TRAIN } from "../../constants/common";

type Values = {
  UA: number[];
  RA: number[];
  TUA: number[];
  TRA: number[];
  RTE: number[];
  FQS: number[];
};

type BubbleChartData = {
  x: number;
  y: number;
  label: number;
  conf: number;
}[];

const BRIGHTEST = 0;
const DARKEST = 1;
const RED = "#bb151a";
const GREEN = "#157f3b";
const baseColors = {
  UA: RED,
  RA: GREEN,
  TUA: RED,
  TRA: GREEN,
  RTE: RED,
  FQS: GREEN,
};

export function calculatePerformanceMetrics(data: Experiments) {
  const values: Values = {
    UA: Object.values(data).map((d) => Number(d.UA)),
    RA: Object.values(data).map((d) => Number(d.RA)),
    TUA: Object.values(data).map((d) => Number(d.TUA)),
    TRA: Object.values(data).map((d) => Number(d.TRA)),
    RTE: Object.values(data)
      .filter((d) => typeof d.RTE === "number")
      .map((d) => d.RTE as number),
    FQS: Object.values(data)
      .filter((d) => typeof d.FQS === "number")
      .map((d) => d.FQS as number),
  };

  const mins = {
    UA: d3.min(values.UA.map((v) => Number(v)))!,
    RA: d3.min(values.RA)!,
    TUA: d3.min(values.TUA.map((v) => Number(v)))!,
    TRA: d3.min(values.TRA)!,
    RTE: d3.min(values.RTE)!,
    FQS: d3.min(values.FQS)!,
  };

  const maxs = {
    UA: d3.max(values.UA.map((v) => Number(v)))!,
    RA: d3.max(values.RA)!,
    TUA: d3.max(values.TUA.map((v) => Number(v)))!,
    TRA: d3.max(values.TRA)!,
    RTE: d3.max(values.RTE)!,
    FQS: d3.max(values.FQS)!,
  };

  return {
    UA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.UA, maxs.UA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.UA,
    },
    RA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.RA, maxs.RA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.RA,
    },
    TUA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.TUA, maxs.TUA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.TUA,
    },
    TRA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.TRA, maxs.TRA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.TRA,
    },
    RTE: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.RTE, maxs.RTE])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.RTE,
    },
    FQS: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.FQS, maxs.FQS])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.FQS,
    },
  };
}

export function processPointsData(points: Point[]) {
  return points
    ? points.map((point) => [
        point[4], // x coordinate
        point[5], // y coordinate
        point[0], // ground truth
        point[1], // prediction
        point[2], // img
        point[6], // prob
      ])
    : [];
}

export function extractBubbleChartData(datasetMode: string, data: Experiment) {
  let bubbleChartData: {
    label_dist: Dist;
    conf_dist: Dist;
  };
  if (datasetMode === TRAIN)
    bubbleChartData = {
      label_dist: data.label_dist,
      conf_dist: data.conf_dist,
    };
  else
    bubbleChartData = {
      label_dist: data.t_label_dist,
      conf_dist: data.t_conf_dist,
    };

  let result: BubbleChartData = [];
  if (bubbleChartData) {
    Object.entries(bubbleChartData.label_dist).forEach(
      ([gtIndex, dist], gtIdx) => {
        Object.entries(dist).forEach(([_, labelValue], predIdx) => {
          const confValue = bubbleChartData.conf_dist[gtIndex][predIdx];
          result.push({
            x: predIdx,
            y: gtIdx,
            label: labelValue,
            conf: confValue,
          });
        });
      }
    );
  }

  return result;
}
