import React, { useState } from "react";
import styles from "./App.module.css";

import Settings from "../views/Settings";
import Histories from "../views/Histories";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";

export default function App() {
  const [svgContents, setSvgContents] = useState<string[]>([]);

  return (
    <section id={styles["body-wrapper"]}>
      <div>
        <Settings setSvgContents={setSvgContents} />
        <Histories />
      </div>
      <div>
        <Embeddings svgContents={svgContents} />
        <PerformanceMetrics />
      </div>
      <PrivacyAttacks />
    </section>
  );
}
