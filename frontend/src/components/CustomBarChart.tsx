import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import styles from "./CustomBarChart.module.css";

import SubTitle from "../components/SubTitle";

const data = [
  {
    class: 0,
    training_accuracy: 0.87,
    test_accuracy: 0.83,
  },
  {
    class: 1,
    training_accuracy: 0.92,
    test_accuracy: 0.89,
  },
  {
    class: 2,
    training_accuracy: 0.78,
    test_accuracy: 0.76,
  },
  {
    class: 3,
    training_accuracy: 0.85,
    test_accuracy: 0.82,
  },
  {
    class: 4,
    training_accuracy: 0.79,
    test_accuracy: 0.77,
  },
  {
    class: 5,
    training_accuracy: 0.88,
    test_accuracy: 0.86,
  },
  {
    class: 6,
    training_accuracy: 0.83,
    test_accuracy: 0.81,
  },
  {
    class: 7,
    training_accuracy: 0.76,
    test_accuracy: 0.74,
  },
  {
    class: 8,
    training_accuracy: 0.84,
    test_accuracy: 0.82,
  },
  {
    class: 9,
    training_accuracy: 0.91,
    test_accuracy: 0.88,
  },
];

interface Props {
  title: string;
  dataKey: "training" | "test";
  color: string;
  barWidth?: number;
}

export default function CustomBarChart({
  title,
  dataKey,
  color,
  barWidth,
}: Props) {
  return (
    <div>
      <div className={styles["title-wrapper"]}>
        <SubTitle subtitle={title} fontSize={11} />
      </div>
      <BarChart
        width={210}
        height={105}
        data={data}
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
        <Tooltip />
        <Bar
          dataKey={`${dataKey}_accuracy`}
          fill={color}
          activeBar={<Rectangle fill="pink" stroke="blue" />}
          barSize={barWidth}
        />
      </BarChart>
    </div>
  );
}
