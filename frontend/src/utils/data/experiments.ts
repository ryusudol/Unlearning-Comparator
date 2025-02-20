import * as d3 from "d3";

import { Dist } from "../../types/data";
import { Experiment, Experiments } from "../../types/experiments-context";
import { TRAIN } from "../../constants/common";

type Values = {
  UA: number[];
  RA: number[];
  TUA: number[];
  TRA: number[];
  PA: number[];
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
  TUA: RED,
  RA: GREEN,
  TRA: GREEN,
  PA: GREEN,
};

export function calculatePerformanceMetrics(data: Experiments) {
  const values: Values = {
    UA: Object.values(data).map((d) => Number(d.UA)),
    TUA: Object.values(data).map((d) => Number(d.TUA)),
    RA: Object.values(data).map((d) => Number(d.RA)),
    TRA: Object.values(data).map((d) => Number(d.TRA)),
    PA: Object.values(data).map((d) => Number(d.PA)),
  };

  const mins = {
    UA: d3.min(values.UA)!,
    TUA: d3.min(values.TUA)!,
    RA: d3.min(values.RA)!,
    TRA: d3.min(values.TRA)!,
    PA: d3.min(values.TRA)!,
  };

  const maxs = {
    UA: d3.max(values.UA)!,
    TUA: d3.max(values.TUA)!,
    RA: d3.max(values.RA)!,
    TRA: d3.max(values.TRA)!,
    PA: d3.max(values.PA)!,
  };

  return {
    UA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.UA, maxs.UA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.UA,
    },
    TUA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.TUA, maxs.TUA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.TUA,
    },
    RA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.RA, maxs.RA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.RA,
    },
    TRA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.TRA, maxs.TRA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.TRA,
    },
    PA: {
      colorScale: d3
        .scaleLinear()
        .domain([mins.PA, maxs.PA])
        .range([BRIGHTEST, DARKEST]),
      baseColor: baseColors.PA,
    },
  };
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
