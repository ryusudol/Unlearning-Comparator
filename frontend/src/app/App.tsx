import React, { useState } from "react";
import styles from "./App.module.css";

import Settings from "../views/Settings";
import Histories from "../views/Histories";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";

export default function App() {
  const [originalSvgContents, setOriginalSvgContents] = useState<string[]>([]);
  const [unlearnedSvgContents, setUnlearnedSvgContents] = useState<string[]>(
    []
  );

  return (
    <section id={styles["body-wrapper"]}>
      <div>
        <Settings
          setOriginalSvgContents={setOriginalSvgContents}
          setUnlearnedSvgContents={setUnlearnedSvgContents}
        />
        <Histories />
      </div>
      <div>
        <Embeddings
          originalSvgContents={originalSvgContents}
          unlearnedSvgContents={unlearnedSvgContents}
        />
        <PerformanceMetrics />
      </div>
      <PrivacyAttacks />
    </section>
  );
}
