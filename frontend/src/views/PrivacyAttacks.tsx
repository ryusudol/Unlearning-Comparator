import styles from "./PrivacyAttacks.module.css";

import Title from "../components/Title";
import SubTitle from "../components/SubTitle";
import ContentBox from "../components/ContentBox";

export default function PrivacyAttacks() {
  return (
    <section className={styles["privacy-attacks"]}>
      <Title title="Privacy Attacks" />
      <ContentBox height={660}>
        <div className={styles.wrapper}>
          <SubTitle subtitle="Model Inversion Attack" />
        </div>
      </ContentBox>
    </section>
  );
}
