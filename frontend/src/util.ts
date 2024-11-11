import * as d3 from "d3";

import { ExperimentData } from "./types/data";
import { Experiments } from "./types/experiments-context";
import { forgetClassNames } from "./constants/forgetClassNames";
import {
  HeatmapData,
  TRAINING,
  TEST,
  LABEL_HEATMAP,
  CONFIDENCE_HEATMAP,
} from "./views/Predictions";

export function getDefaultUnlearningConfig(method: string) {
  let epochs, learning_rate;

  if (method === "ft") {
    epochs = 10;
    learning_rate = -2;
  } else if (method === "rl") {
    epochs = 3;
    learning_rate = -2;
  } else if (method === "ga") {
    epochs = 3;
    learning_rate = -4;
  } else {
    epochs = 30;
    learning_rate = -2;
  }

  return { epochs, learning_rate };
}

export function hexToRgba(hex: string, opacity: number) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getPhaseColors(
  phase: string,
  colorOpacity: number,
  backgroundColorOpacity: number
) {
  let color, backgroundColor;
  if (phase === "Unlearned") {
    color = `rgba(255, 140, 0, ${colorOpacity})`;
    backgroundColor = `rgba(255, 140, 0, ${backgroundColorOpacity})`;
  } else if (phase === "Defended") {
    color = `rgba(34, 139, 34, ${colorOpacity})`;
    backgroundColor = `rgba(34, 139, 34, ${backgroundColorOpacity})`;
  } else if (phase === "Pretrained") {
    color = `rgba(80, 80, 80, ${colorOpacity})`;
    backgroundColor = `rgba(80, 80, 80, ${backgroundColorOpacity})`;
  } else {
    color = `rgba(218, 165, 32, ${colorOpacity})`;
    backgroundColor = `rgba(218, 165, 32, ${backgroundColorOpacity})`;
  }
  return { color, backgroundColor };
}

export function calculatePerformanceMetrics(data: Experiments) {
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
  };

  type Values = {
    UA: number[];
    RA: number[];
    TUA: number[];
    TRA: number[];
    RTE: number[];
  };

  const values: Values = {
    UA: Object.values(data).map((d) => d.UA),
    RA: Object.values(data).map((d) => d.RA),
    TUA: Object.values(data).map((d) => d.TUA),
    TRA: Object.values(data).map((d) => d.TRA),
    RTE: Object.values(data)
      .filter((d) => typeof d.RTE === "number")
      .map((d) => d.RTE as number),
  };

  const mins = {
    UA: d3.min(values.UA.map((v) => Number(v)))!,
    RA: d3.min(values.RA)!,
    TUA: d3.min(values.TUA.map((v) => Number(v)))!,
    TRA: d3.min(values.TRA)!,
    RTE: d3.min(values.RTE)!,
  };

  const maxs = {
    UA: d3.max(values.UA.map((v) => Number(v)))!,
    RA: d3.max(values.RA)!,
    TUA: d3.max(values.TUA.map((v) => Number(v)))!,
    TRA: d3.max(values.TRA)!,
    RTE: d3.max(values.RTE)!,
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
        // point[3]: is_forget
      ])
    : [];
}

export function extractHeatmapData(
  datasetMode: string,
  chartMode: string,
  data: ExperimentData | undefined
) {
  let distributionData;
  if (datasetMode === TRAINING && chartMode === LABEL_HEATMAP)
    distributionData = data?.label_dist;
  else if (datasetMode === TRAINING && chartMode === CONFIDENCE_HEATMAP)
    distributionData = data?.conf_dist;
  else if (datasetMode === TEST && chartMode === LABEL_HEATMAP)
    distributionData = data?.t_label_dist;
  else if (datasetMode === TEST && chartMode === CONFIDENCE_HEATMAP)
    distributionData = data?.t_conf_dist;

  let processedData: HeatmapData = [];
  if (distributionData) {
    Object.entries(distributionData).forEach(([_, preds], gtIdx) => {
      Object.entries(preds).forEach(([_, value], predIdx) => {
        processedData.push({
          x: forgetClassNames[predIdx],
          y: forgetClassNames[gtIdx],
          value,
        });
      });
    });
  }

  return processedData;
}
