import React from "react";
import styles from "./PrivacyAttacks.module.css";

import Title from "../components/Title";
import SubTitle from "../components/SubTitle";
import ContentBox from "../components/ContentBox";

export default function PrivacyAttacks() {
  return (
    <section>
      <Title title="Privacy Attacks" />
      <ContentBox height={498}>
        <div className={styles.wrapper}>
          <SubTitle subtitle="Model Inversion Attack" />
        </div>
      </ContentBox>
      <ContentBox height={428}>
        <div className={styles.wrapper}>
          <SubTitle subtitle="Membership Inference Attack" />
        </div>
      </ContentBox>
    </section>
  );
}
