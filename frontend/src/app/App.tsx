import React from "react";
import styles from "./App.module.css";

import Settings from "../views/Settings";
import Histories from "../views/Histories";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";

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
