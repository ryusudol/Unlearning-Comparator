import React from "react";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import SubTitle from "../components/SubTitle";

const data = [
  {
    class: 0,
    ua: 5.23,
    ra: 5.87,
    ta: 5.67,
    rte: 5.78,
  },
  {
    class: 1,
    ua: 6.89,
    ra: 6.43,
    ta: 6.01,
    rte: 6.12,
  },
  {
    class: 2,
    ua: 4.34,
    ra: 4.09,
    ta: 4.45,
    rte: 4.45,
  },
  {
    class: 3,
    ua: 5.9,
    ra: 5.65,
    ta: 5.89,
    rte: 5.89,
  },
  {
    class: 4,
    ua: 4.56,
    ra: 4.21,
    ta: 4.34,
    rte: 4.34,
  },
  {
    class: 5,
    ua: 6.01,
    ra: 5.76,
    ta: 5.9,
    rte: 5.9,
  },
  {
    class: 6,
    ua: 5.67,
    ra: 5.32,
    ta: 5.56,
    rte: 5.56,
  },
  {
    class: 7,
    ua: 4.23,
    ra: 4.98,
    ta: 4.12,
    rte: 4.23,
  },
  {
    class: 8,
    ua: 5.78,
    ra: 5.54,
    ta: 5.67,
    rte: 5.67,
  },
  {
    class: 9,
    ua: 6.12,
    ra: 6.1,
    ta: 6.23,
    rte: 6.01,
  },
];
const width = 240;
const height = 110;

interface Props {
  dataKey: "ua" | "ra" | "ta" | "rte";
  color: "4E79A7" | "F28E2B" | "E15759" | "76B7B2";
}

export default function CustomBarChart({ dataKey, color }: Props) {
  return (
    <div>
      <SubTitle subtitle="Unlearning Accuracy" fontSize={12} />
      <ResponsiveContainer width={width} height={height}>
        <BarChart
          data={data}
          margin={{
            top: 0,
            right: 0,
            bottom: 0,
            left: -42,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis fontSize={9} dataKey="class" />
          <YAxis fontSize={9} />
          <Tooltip />
          <Bar
            dataKey={dataKey}
            fill={`#${color}`}
            activeBar={<Rectangle fill="pink" stroke="blue" />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
