import * as d3 from "d3";

import Chart from "../components/Chart";

interface Props {
  mode: "baseline" | "comparison";
}

export default function SvgViewer({ mode }: Props) {
  const data = () => {
    const random = d3.randomNormal(0, 0.2);
    const sqrt3 = Math.sqrt(3);

    const result: number[][] = [];

    result.push(
      ...Array.from({ length: 300 }, () => [random() + sqrt3, random() + 1, 0]),
      ...Array.from({ length: 300 }, () => [random() - sqrt3, random() + 1, 1]),
      ...Array.from({ length: 300 }, () => [random(), random() - 1, 2]),
      ...Array.from({ length: 300 }, () => [
        random() + sqrt3,
        random() - sqrt3,
        3,
      ]),
      ...Array.from({ length: 300 }, () => [
        random() - sqrt3,
        random() - sqrt3,
        4,
      ]),
      ...Array.from({ length: 300 }, () => [
        random() + 2 * sqrt3,
        random() + 1,
        5,
      ]),
      ...Array.from({ length: 300 }, () => [
        random() - 2 * sqrt3,
        random() + 1,
        6,
      ]),
      ...Array.from({ length: 300 }, () => [random() + 2, random() - 1, 7]),
      ...Array.from({ length: 300 }, () => [random() - 2, random() - 1, 8]),
      ...Array.from({ length: 300 }, () => [random() * 1.5, random() * 1.5, 9])
    );

    return result;
  };

  return (
    <div className="w-[630px] h-[668px] flex flex-col justify-center items-center">
      <Chart data={data()} width={620} height={630} />
    </div>
  );
}
