import styles from "./App.module.css";

import Settings from "../views/Settings";
import Archives from "../views/Archives";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";

export default function App() {
  return (
    <section id={styles["body-wrapper"]}>
      <div>
        <Settings />
        <Archives />
      </div>
      <div>
        <Embeddings />
        <PerformanceMetrics />
      </div>
      <PrivacyAttacks />
    </section>
  );
}
