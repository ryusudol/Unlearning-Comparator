import * as d3 from "d3";

import { Dist } from "../../types/data";
import { ExperimentData } from "../../types/data";
import { Experiments } from "../../types/experiments-context";
import { HeatmapData, TRAINING } from "../../views/Predictions";

type Values = {
  UA: number[];
  RA: number[];
  TUA: number[];
  TRA: number[];
  RTE: number[];
  FQ: number[];
};

type BubbleChartData = {
  x: number;
  y: number;
  label: number;
  conf: number;
}[];

const BRIGHTEST = 0;
const DARKEST = 1;
const RED = "#D98585";
const GREEN = "#429D4D";
const baseColors = {
  UA: RED,
  RA: GREEN,
  TUA: RED,
  TRA: GREEN,
  RTE: RED,
  FQ: RED,
};

// TODO: MIA에 있는 RTE 모두 MIA로 변경할 것
export function calculatePerformanceMetrics(data: Experiments) {
  const values: Values = {
    UA: Object.values(data).map((d) => d.UA),
    RA: Object.values(data).map((d) => d.RA),
    TUA: Object.values(data).map((d) => d.TUA),
    TRA: Object.values(data).map((d) => d.TRA),
    RTE: Object.values(data)
      .filter((d) => typeof d.RTE === "number")
      .map((d) => d.RTE as number),
    FQ: Object.values(data)
      .filter((d) => typeof d.RTE === "number")
      .map((d) => d.RTE as number),
  };

  const mins = {
    UA: d3.min(values.UA.map((v) => Number(v)))!,
    RA: d3.min(values.RA)!,
    TUA: d3.min(values.TUA.map((v) => Number(v)))!,
    TRA: d3.min(values.TRA)!,
    RTE: d3.min(values.RTE)!,
    FQ: d3.min(values.RTE)!,
  };

  const maxs = {
    UA: d3.max(values.UA.map((v) => Number(v)))!,
    RA: d3.max(values.RA)!,
    TUA: d3.max(values.TUA.map((v) => Number(v)))!,
    TRA: d3.max(values.TRA)!,
    RTE: d3.max(values.RTE)!,
    FQ: d3.max(values.RTE)!,
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
    FQ: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.RTE, maxs.RTE])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.RTE,
    },
  };
}

export function extractSelectedData(data: ExperimentData | undefined) {
  return data
    ? data.points.map((point) => [
        point[4], // x coordinate
        point[5], // y coordinate
        point[0], // ground truth
        point[1], // prediction
        point[2], // img
        point[6], // prob
      ])
    : [];
}

export function extractHeatmapData(datasetMode: string, data: ExperimentData) {
  let distributionData: number[][];
  if (datasetMode === TRAINING) distributionData = data.cka.train.forget_class;
  else distributionData = data.cka.test.forget_class;

  let result: HeatmapData = [];
  distributionData.forEach((row, gtIdx) => {
    row.forEach((value, predIdx) => {
      result.push({
        x: data.cka.layers[predIdx],
        y: data.cka.layers[gtIdx],
        value: value,
      });
    });
  });

  return result;
}

export function extractBubbleChartData(
  datasetMode: string,
  data: ExperimentData
) {
  let bubbleChartData: {
    label_dist: Dist;
    conf_dist: Dist;
  };
  if (datasetMode === TRAINING)
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
