import * as d3 from "d3";

import { Dist } from "../../types/data";
import { Experiment, Experiments } from "../../types/data";
import { TRAIN } from "../../constants/common";

const metrics = ["UA", "TUA", "RA", "TRA", "PA", "RTE", "FQS"] as const;
export function calculatePerformanceMetrics(data: Experiments) {
  const values = metrics.reduce((acc, key) => {
    acc[key] = Object.values(data).map((d) => Number(d[key]));
    return acc;
  }, {} as Record<(typeof metrics)[number], number[]>);

  const mins = metrics.reduce((acc, key) => {
    acc[key] = d3.min(values[key])!;
    return acc;
  }, {} as Record<(typeof metrics)[number], number>);

  const maxes = metrics.reduce((acc, key) => {
    acc[key] = d3.max(values[key])!;
    return acc;
  }, {} as Record<(typeof metrics)[number], number>);

  return metrics.reduce((acc, key) => {
    acc[key] = d3.scaleLinear().domain([mins[key], maxes[key]]).range([0, 1]);
    return acc;
  }, {} as Record<(typeof metrics)[number], d3.ScaleLinear<number, number>>);
}

type BubbleChartData = {
  x: number;
  y: number;
  label: number;
  conf: number;
}[];

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
