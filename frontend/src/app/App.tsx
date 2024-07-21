import React from "react";
import styles from "./App.module.css";

import Settings from "../sections/Settings";
import Histories from "../sections/Histories";
import Embeddings from "../sections/Embeddings";
import PerformanceMetrics from "../sections/PerformanceMetrics";
import PrivacyAttacks from "../sections/PrivacyAttacks";

export default function App() {
  return (
    <section id={styles["body-wrapper"]}>
      <div>
        <Settings />
        <Histories />
      </div>
      <div>
        <Embeddings />
        <PerformanceMetrics />
      </div>
      <PrivacyAttacks />
    </section>
  );
}
