import React from "react";
import styles from "./App.module.css";

import Title from "../views/Title";
import ContentBox from "../views/ContentBox";

import Settings from "../sections/Settings";
import Embeddings from "../sections/Embeddings";
import PerformanceMetrics from "../sections/PerformanceMetrics";

export default function App() {
  return (
    <section id={styles["body-wrapper"]}>
      <Settings />
      <Title title="Histories" />
      <ContentBox height={20}></ContentBox>
      <div>
        <Title title="Embeddings" />
        <Embeddings />
        <PerformanceMetrics />
      </div>
      <div>
        <Title title="Privacy Attacks" />
        <ContentBox height={50}></ContentBox>
        <ContentBox height={45}></ContentBox>
      </div>
    </section>
  );
}
