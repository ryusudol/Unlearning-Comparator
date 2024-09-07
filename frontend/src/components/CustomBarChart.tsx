import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { TABLEAU10 } from "../constants/tableau10";

interface Props {
  data: { [key: string]: any } | undefined;
}

export default function CustomBarChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data) return [];

    const newChartData = Object.entries(data).map(([key, value]) => ({
      class: key,
      accuracy: parseFloat(value as string),
    }));

    return newChartData;
  }, [data]);

  if (!data) return null;

  return (
    <div>
      <BarChart
        width={200}
        height={120}
        data={chartData}
        margin={{
          top: 0,
          right: 0,
          bottom: 0,
          left: -40,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis fontSize={9} dataKey="class" />
        <YAxis fontSize={9} />
        {chartData.length > 0 && <Tooltip />}
        <Bar dataKey="accuracy" barSize={10}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={TABLEAU10[index % TABLEAU10.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}
