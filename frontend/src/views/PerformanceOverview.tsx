import styles from "./PerformanceOverview.module.css";

import ForgetClassSelector from "../components/ForgetClassSelector";
import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

const getColorForValue = (value: number) => {
  if (value >= 0.95) return "#a1d76a";
  if (value >= 0.9) return "#d9ef8b";
  if (value >= 0.85) return "#f7f7f7";
  if (value >= 0.8) return "#fde0ef";
  if (value >= 0.75) return "#f1b6da";
  return "#e9a3c9";
};

const TableCell = ({ value }: { value: number }) => {
  const style = {
    backgroundColor: getColorForValue(value),
  };

  return <div style={style}>{value}</div>;
};

export default function PerformanceOverview() {
  return (
    <section className={styles["performance-overview"]}>
      <Title title="Performance Overview" />
      <ContentBox height={238}>
        <ForgetClassSelector width={60} isTextShow={false} />
        <div className={styles.table}>
          <div className={styles["table-header"]}>
            <div>ID</div>
            <div>Model</div>
            <div>Dataset</div>
            <div>Unlearn</div>
            <div>Trained Model</div>
            <div>Defense</div>
            <div>Epoch</div>
            <div>LR</div>
            <div>Batch</div>
            <div>UA</div>
            <div>RA</div>
            <div>TA</div>
            <div>MIA</div>
            <div>Avg. Gap</div>
            <div>RTE</div>
          </div>
          <div className={`${styles["table-row"]} ${styles["first-row"]}`}>
            <div>0</div>
            <div>ResNet18</div>
            <div>CIFAR-10</div>
            <div>Retrain</div>
            <div>Basic</div>
            <div>Defense X</div>
            <div>100</div>
            <div>0.01</div>
            <div>32</div>
            <TableCell value={0.95} />
            <TableCell value={0.95} />
            <TableCell value={0.9} />
            <TableCell value={0.82} />
            <TableCell value={0.0} />
            <TableCell value={3.95} />
          </div>
          <div className={styles["table-row"]}>
            <div>1</div>
            <div>ResNet18</div>
            <div>VggFace</div>
            <div>Gradient-Ascent</div>
            <div>best_train_resnet18_CIFAR10_30epochs_0.01lr.pth</div>
            <div>Defense Y</div>
            <div>150</div>
            <div>0.005</div>
            <div>64</div>
            <TableCell value={0.97} />
            <TableCell value={0.94} />
            <TableCell value={0.93} />
            <TableCell value={0.82} />
            <TableCell value={2.17} />
            <TableCell value={0.03} />
          </div>
        </div>
      </ContentBox>
    </section>
  );
}
