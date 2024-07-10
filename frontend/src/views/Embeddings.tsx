import React from "react";
import styles from "./Embeddings.module.css";

type PropsType = {
  data: string;
};

export default function Settings({ data }: PropsType) {
  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <p className={styles.subtitle}>Original Model</p>
        <img
          className={styles.img}
          src="/model1.png"
          alt="Embedding model img1"
        />
      </div>
      <div style={{ width: "10px" }} />
      <div className={styles.wrapper}>
        <p className={styles.subtitle}>Unlearned Model</p>
        <img
          className={styles.img}
          src="/model2.png"
          alt="Embedding model img2"
        />
      </div>
    </section>
  );
}
