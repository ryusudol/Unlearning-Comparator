import React from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";

type PropsType = {
  svgContents: string[];
};

export default function Settings({ svgContents }: PropsType) {
  const createMarkup = (svg: string) => {
    return { __html: svg };
  };

  console.log(svgContents);

  return (
    <section>
      <Title title="Embeddings" />
      <div className={styles.section}>
        <ContentBox height={456}>
          <div className={styles.wrapper}>
            <SubTitle subtitle="Original Model" />
            {svgContents && (
              <div className={styles["svg-wrapper"]}>
                <div
                  className={styles.svg}
                  dangerouslySetInnerHTML={createMarkup(svgContents[0])}
                />
                <div
                  className={styles.svg}
                  dangerouslySetInnerHTML={createMarkup(svgContents[1])}
                />
                <div
                  className={styles.svg}
                  dangerouslySetInnerHTML={createMarkup(svgContents[2])}
                />
                <div
                  className={styles.svg}
                  dangerouslySetInnerHTML={createMarkup(svgContents[3])}
                />
              </div>
            )}
          </div>
        </ContentBox>
        <ContentBox height={456}>
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
