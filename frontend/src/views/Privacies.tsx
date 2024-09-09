import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { SecurityCheckIcon } from "../components/UI/icons";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "../components/UI/chart";

interface Props {
  height: number;
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function Privacies({ height }: Props) {
  return (
    <section className="w-[460px] p-[6px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]">
      <div className="w-full flex flex-col justify-center">
        <div className="flex items-center">
          <SecurityCheckIcon />
          <h5 className="font-semibold ml-[3px]">Privacies</h5>
        </div>
        <div className="w-full flex justify-center items-center mb-[5px]">
          <ChartContainer config={chartConfig} className="w-[420px] h-[250px]">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 0,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="var(--color-mobile)"
                fillOpacity={0.4}
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="var(--color-desktop)"
                fillOpacity={0.4}
                stroke="var(--color-desktop)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </div>
        <div className="flex justify-center">
          <img className="w-[345px]" src="/attack.png" alt="attack img" />
        </div>
      </div>
    </section>
  );
}
