import { useEffect, useContext } from "react";
import styles from "./App.module.css";

import Settings from "../views/Settings";
import PerformanceOverview from "../views/PerformanceOverview";
import PerformanceMetrics from "../views/PerformanceMetrics";
import Embeddings from "../views/Embeddings";
import Privacies from "../views/Privacies";
import { BaselineContext } from "../store/baseline-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { OverviewContext } from "../store/overview-context";
import { RunningStatusContext } from "../store/running-status-context";

const UPPER_HEIGHT = 265;
const LOWER_HEIGHT = 615;

export default function App() {
  const { baseline, saveBaseline, retrieveBaseline } =
    useContext(BaselineContext);
  const { saveSelectedID } = useContext(SelectedIDContext);
  const { overview, retrieveOverview } = useContext(OverviewContext);
  const { initRunningStatus } = useContext(RunningStatusContext);

  useEffect(() => {
    retrieveBaseline();
    retrieveOverview();

    saveBaseline(baseline ?? 0);
    saveSelectedID(overview.length === 0 ? 0 : overview.length - 1);

    console.log(overview.length);

    initRunningStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview.length]);

  return (
    <section className={styles["body-wrapper"]}>
      <div className={styles.row}>
        <Settings height={UPPER_HEIGHT} />
        <PerformanceOverview height={UPPER_HEIGHT} />
        <PerformanceMetrics height={UPPER_HEIGHT} />
      </div>
      <div className={styles.row}>
        <Embeddings height={LOWER_HEIGHT} />
        <Privacies height={LOWER_HEIGHT} />
      </div>
    </section>
  );
}
