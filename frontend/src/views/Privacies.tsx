import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ImageDelete01Icon,
  SecurityCheckIcon,
  UserQuestion01Icon,
} from "../components/UI/icons";
import { Button } from "../components/UI/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/UI/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/UI/chart";
import React from "react";

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

const ATTACKS = ["MSE", "PSNR", "LPIPS"];

export default function Privacies({ height }: Props) {
  const [attack, setAttack] = useState(ATTACKS[0]);

  const handleBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.id;
    console.log(id === "prev" ? "MIA Prev Clicked!" : "MIA Next Clicked!");
  };

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[480px] p-[5px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="w-full flex flex-col justify-center relative">
        <div className="flex items-center">
          <SecurityCheckIcon />
          <h5 className="font-semibold ml-[3px]">Privacies</h5>
        </div>
        <div className="w-full flex flex-col justify-center items-center mb-[5px]">
          <div className="w-full flex justify-start items-center mb-1">
            <UserQuestion01Icon className="mr-[2px]" />
            <p className="text-[15px]">Membership Inference Attack</p>
          </div>
          <ChartContainer config={chartConfig} className="w-[420px] h-[182px]">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: -20,
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
            </AreaChart>
          </ChartContainer>
        </div>
        <div className="flex flex-col justify-start items-center relative">
          <div className="absolute right-0 -top-1">
            <Select onValueChange={setAttack}>
              <SelectTrigger className="w-[70px] h-7 pr-1 bg-white text-black font-normal">
                <SelectValue placeholder={attack} />
              </SelectTrigger>
              <SelectContent className="w-[70px]">
                {ATTACKS.map((el, idx) => (
                  <SelectItem key={idx} value={el}>
                    {el}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full flex justify-start items-center mb-1">
            <ImageDelete01Icon className="mr-[2px]" />
            <p className="text-[15px]">Model Inversion Attack</p>
          </div>
          <div className="w-[468px] h-[444px] p-[5px] flex flex-col justify-start items-center border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
            <div className="flex justify-between items-center text-[15px] font-light w-[300px]">
              <p>Comparison Model</p>
              <p>Proposed Model</p>
            </div>
            <img
              className="w-[400px] h-[390px]"
              src="/attack.png"
              alt="attack img"
            />
          </div>
        </div>
        <div className="w-[70px] flex justify-between absolute bottom-[5px] right-[5px]">
          <Button
            id="prev"
            onClick={handleBtnClick}
            variant="outline"
            className="w-8 h-[18px]"
          >
            {"<"}
          </Button>
          <Button
            id="next"
            onClick={handleBtnClick}
            variant="outline"
            className="w-8 h-[18px]"
          >
            {">"}
          </Button>
        </div>
      </div>
    </section>
  );
}
