import React from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";

export default function Settings() {
  return (
    <section>
      <Title title="Embeddings" />
      <div className={styles.section}>
        <ContentBox height={458}>
          <div className={styles.wrapper}>
            <SubTitle subtitle="Original Model" />
            <img
              className={styles.img}
              src="/model1.png"
              alt="Embedding model img1"
            />
          </div>
        </ContentBox>
        <ContentBox height={458}>
          <div className={styles.wrapper}>
            <SubTitle subtitle="Unlearned Model" />
            <img
              className={styles.img}
              src="/model2.png"
              alt="Embedding model img2"
            />
          </div>
        </ContentBox>
      </div>
    </section>
  );
}
