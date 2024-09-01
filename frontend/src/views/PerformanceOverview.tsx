import React, { useContext, useEffect } from "react";
import styles from "./PerformanceOverview.module.css";

import ForgetClassSelector from "../components/ForgetClassSelector";
import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import { OverviewContext } from "../store/overview-context";
import { BaselineContext } from "../store/baseline-context";
import { SelectedIDContext } from "../store/selected-id-context";
import retrainData from "../constants/result_GT_1.json";

const getColorForValue = (value: number) => {
  if (value >= 0.95) return "#a1d76a";
  if (value >= 0.9) return "#d9ef8b";
  if (value >= 0.85) return "#f7f7f7";
  if (value >= 0.8) return "#fde0ef";
  if (value >= 0.75) return "#f1b6da";
  return "#e9a3c9";
};

const TableCell = ({ value }: { value: number | string }) => {
  const style = {
    backgroundColor: getColorForValue(Number(value)),
  };

  return <div style={style}>{value}</div>;
};

const Legend = ({
  title,
  min,
  max,
}: {
  title: string;
  min: number;
  max: number;
}) => {
  return (
    <div className={styles.legend}>
      <div className={styles["legend-title"]}>{title}</div>
      <div className={styles.bar}>
        <div className={styles.gradient}></div>
        <div className={styles["legend-values"]}>
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

interface Props {
  height: number;
}

export default function PerformanceOverview({ height }: Props) {
  const { overview, retrieveOverview } = useContext(OverviewContext);
  const { baseline } = useContext(BaselineContext);
  const { selectedID, saveSelectedID } = useContext(SelectedIDContext);

  useEffect(() => {
    retrieveOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOverview = overview.filter(
    (el) => el.forget_class === baseline.toString()
  );

  const handleTableRowClick = (idx: number) => {
    saveSelectedID(idx);
  };

  return (
    <section className={styles["performance-overview"]}>
      <Title title="Performance Overview" />
      <ContentBox height={height}>
        <div className={styles.top}>
          <ForgetClassSelector width={70} isTextShow={false} />
          <Legend title="Acc" min={0} max={1} />
        </div>
        <div className={styles.table}>
          <div className={styles["table-header"]}>
            <div>Index</div>
            <div>Model</div>
            <div>Dataset</div>
            <div>Training</div>
            <div>Unlearning</div>
            <div>Defense</div>
            <div>UA</div>
            <div>RA</div>
            <div>TA</div>
            <div>MIA</div>
            <div>Avg. Gap</div>
            <div>RTE</div>
          </div>
          <div className={`${styles["table-row"]} ${styles["first-row"]}`}>
            <div>0</div>
            <div>{retrainData.model}</div>
            <div>{retrainData.dataset}</div>
            <div>{retrainData.training}</div>
            <div>{retrainData.unlearning.method}</div>
            <div>{retrainData.defense}</div>
            <TableCell value={retrainData.unlearn_accuracy} />
            <TableCell value={retrainData.remain_accuracy} />
            <TableCell value={retrainData.test_accuracy} />
            <TableCell value={retrainData.MIA} />
            <div>0.0</div>
            <div>{retrainData.RTE}</div>
          </div>
          {filteredOverview?.map((el, idx) => {
            const ua = Number((el.ua / 100).toFixed(3));
            const ra = Number((el.ra / 100).toFixed(3));
            const ta = Number((el.ta / 100).toFixed(3));
            return (
              <div
                key={idx}
                onClick={() => handleTableRowClick(idx)}
                className={`${styles["table-row"]} ${
                  selectedID === idx ? styles.selected : ""
                }`}
              >
                <div>{idx + 1}</div>
                <div>{el.model}</div>
                <div>{el.dataset}</div>
                <div>-</div>
                <div>{el.unlearn}</div>
                <div>{el.defense}</div>
                <TableCell value={ua} />
                <TableCell value={ra} />
                <TableCell value={ta} />
                <TableCell value={el.mia} />
                <div>{el.avg_gap}</div>
                <div>{el.rte}</div>
              </div>
            );
          })}
        </div>
      </ContentBox>
    </section>
  );
}
