import styles from "./App.module.css";

import Settings from "../views/Settings";
import PerformanceOverview from "../views/PerformanceOverview";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";

export default function App() {
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
