import { useContext, useEffect } from "react";
import styles from "./PerformanceOverview.module.css";

import ForgetClassSelector from "../components/ForgetClassSelector";
import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import { OverviewContext } from "../store/overview-context";
import { BaselineContext } from "../store/baseline-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { retrainedData } from "../constants/gt";
import { getColorForValue } from "../util";

const TableCell = ({ value }: { value: number | string }) => {
  return (
    <div
      style={{
        backgroundColor: getColorForValue(Number(value)),
      }}
    >
      {value}
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

  const currRetrainedData = retrainedData[baseline];
  const retrainedUA = currRetrainedData.unlearn_accuracy;
  const retrainedRA = currRetrainedData.remain_accuracy;
  const retrainedTA = currRetrainedData.test_accuracy;

  return (
    <section className={styles["performance-overview"]}>
      <Title title="Performance Overview" />
      <ContentBox height={height}>
        <div className={styles.top}>
          <ForgetClassSelector width={70} isTextShow={false} />
          <div className={styles.legend}>
            <div className={styles["legend-title"]}>Acc</div>
            <div className={styles.bar}>
              <div className={styles.gradient}></div>
              <div className={styles["legend-values"]}>
                <span>0</span>
                <span>1</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.table}>
          <div className={styles["table-header"]}>
            <div>ID</div>
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
            <div>Logit</div>
          </div>
          <div className={`${styles["table-row"]} ${styles["first-row"]}`}>
            <div>{currRetrainedData.id}</div>
            <div>{currRetrainedData.model}</div>
            <div>{currRetrainedData.dataset}</div>
            <div>{currRetrainedData.training}</div>
            <details style={{ cursor: "pointer" }}>
              <summary>{currRetrainedData.unlearning.method}</summary>
              <p style={{ height: "4px" }} />
              <p>
                <strong>Epochs</strong>: {currRetrainedData.unlearning.epochs}
              </p>
              <p>
                <strong>Learning Rate</strong>:{" "}
                {currRetrainedData.unlearning.learning_rate}
              </p>
              <p>
                <strong>Batch Size</strong>:{" "}
                {currRetrainedData.unlearning.batch_size}
              </p>
            </details>
            <div>{currRetrainedData.defense}</div>
            <TableCell value={retrainedUA === "0.000" ? 0 : retrainedUA} />
            <TableCell value={retrainedRA === "0.000" ? 0 : retrainedRA} />
            <TableCell value={retrainedTA === "0.000" ? 0 : retrainedTA} />
            <TableCell value={currRetrainedData.MIA} />
            <div>0</div>
            <div>{currRetrainedData.RTE.toFixed(1)}</div>
            <div>{currRetrainedData.mean_logits.toFixed(2)}</div>
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
                <div>{el.training}</div>
                <details>
                  <summary>{el.unlearning}</summary>
                  <p style={{ height: "4px" }} />
                  <p>
                    <strong>Epochs</strong>: {el.epochs}
                  </p>
                  <p>
                    <strong>Learning Rate</strong>: {el.learning_rate}
                  </p>
                  <p>
                    <strong>Batch Size</strong>: {el.batch_size}
                  </p>
                </details>
                <div>{el.defense}</div>
                <TableCell value={ua === 0 ? 0 : ua} />
                <TableCell value={ra === 0 ? 0 : ra} />
                <TableCell value={ta === 0 ? 0 : ta} />
                <TableCell value={el.mia} />
                <div>{el.avg_gap}</div>
                <div>{el.rte}</div>
                <div>Yet</div>
              </div>
            );
          })}
        </div>
      </ContentBox>
    </section>
  );
}
