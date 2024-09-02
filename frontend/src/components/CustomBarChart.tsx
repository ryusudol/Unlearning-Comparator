import { useMemo, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import { BaselineContext } from "../store/baseline-context";

interface Props {
  data: { [key: string]: any } | undefined;
  dataKey: "training" | "test";
  color: string;
}

export default function CustomBarChart({ data, dataKey, color }: Props) {
  const { baseline } = useContext(BaselineContext);

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
        <XAxis
          fontSize={9}
          dataKey="class"
          tickFormatter={(tick) =>
            tick === baseline ? (
              <tspan style={{ fontWeight: "bold" }}>{tick}</tspan>
            ) : (
              tick
            )
          }
        />
        <YAxis fontSize={9} />
        {chartData.length > 0 && <Tooltip />}
        <Bar dataKey="accuracy" fill={color} barSize={8} />
      </BarChart>
    </div>
  );
}
