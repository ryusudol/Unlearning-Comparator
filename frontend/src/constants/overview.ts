import * as d3 from "d3";

import { defaultUnlearningData } from "./basicData";

const RED = "#D98585";
const GREEN = "#429D4D";
const BRIGHTEST = 0;
const DARKEST = 1;
export const NotAvailable = "N/A";

const values = {
  unlearn_accuracy: defaultUnlearningData.map((d) => d.unlearn_accuracy),
  remain_accuracy: defaultUnlearningData.map((d) => d.remain_accuracy),
  test_unlearn_accuracy: defaultUnlearningData.map(
    (d) => d.test_unlearn_accuracy
  ),
  test_remain_accuracy: defaultUnlearningData.map(
    (d) => d.test_remain_accuracy
  ),
  RTE: defaultUnlearningData.map((d) => d.RTE),
};

const baseColors = {
  unlearn_accuracy: RED,
  remain_accuracy: GREEN,
  test_unlearn_accuracy: RED,
  test_remain_accuracy: GREEN,
  RTE: RED,
};

const mins = {
  unlearn_accuracy: d3.min(
    values.unlearn_accuracy
      .filter((v) => v !== NotAvailable)
      .map((v) => Number(v))
  )!,
  remain_accuracy: d3.min(values.remain_accuracy)!,
  test_unlearn_accuracy: d3.min(
    values.test_unlearn_accuracy
      .filter((v) => v !== NotAvailable)
      .map((v) => Number(v))
  )!,
  test_remain_accuracy: d3.min(values.test_remain_accuracy)!,
  RTE: d3.min(values.RTE)!,
};

const maxs = {
  unlearn_accuracy: d3.max(
    values.unlearn_accuracy
      .filter((v) => v !== NotAvailable)
      .map((v) => Number(v))
  )!,
  remain_accuracy: d3.max(values.remain_accuracy)!,
  test_unlearn_accuracy: d3.max(
    values.test_unlearn_accuracy
      .filter((v) => v !== NotAvailable)
      .map((v) => Number(v))
  )!,
  test_remain_accuracy: d3.max(values.test_remain_accuracy)!,
  RTE: d3.max(values.RTE)!,
};

export const performanceMetrics = {
  unlearn_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.unlearn_accuracy, maxs.unlearn_accuracy])
      .range([BRIGHTEST, DARKEST]),
    baseColor: baseColors.unlearn_accuracy,
  },
  remain_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.remain_accuracy, maxs.remain_accuracy])
      .range([BRIGHTEST, DARKEST]),
    baseColor: baseColors.remain_accuracy,
  },
  test_unlearn_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.test_unlearn_accuracy, maxs.test_unlearn_accuracy])
      .range([BRIGHTEST, DARKEST]),
    baseColor: baseColors.test_unlearn_accuracy,
  },
  test_remain_accuracy: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.test_remain_accuracy, maxs.test_remain_accuracy])
      .range([BRIGHTEST, DARKEST]),
    baseColor: baseColors.test_remain_accuracy,
  },
  RTE: {
    colorScale: d3
      .scaleLinear()
      .domain([mins.RTE, maxs.RTE])
      .range([BRIGHTEST, DARKEST]),
    baseColor: baseColors.RTE,
  },
};
