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

export default function App() {
  const { baseline, saveBaseline } = useContext(BaselineContext);
  const { saveSelectedID } = useContext(SelectedIDContext);
  const { overview } = useContext(OverviewContext);

  useEffect(() => {
    saveBaseline(baseline ?? 0);
    saveSelectedID(overview.length === 0 ? 0 : overview.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles["body-wrapper"]}>
      <div className={styles.row}>
        <Settings />
        <PerformanceOverview />
        <PerformanceMetrics />
      </div>
      <div className={styles.row}>
        <Embeddings />
        <Privacies />
      </div>
    </section>
  );
}
