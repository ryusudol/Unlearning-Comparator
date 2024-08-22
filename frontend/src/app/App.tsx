import { useEffect, useContext } from "react";
import styles from "./App.module.css";

import Settings from "../views/Settings";
import PerformanceOverview from "../views/PerformanceOverview";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";
import { BaselineContext } from "../store/baseline-context";

export default function App() {
  const { saveBaseline } = useContext(BaselineContext);

  useEffect(() => {
    saveBaseline(0);
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
        <PrivacyAttacks />
      </div>
    </section>
  );
}
