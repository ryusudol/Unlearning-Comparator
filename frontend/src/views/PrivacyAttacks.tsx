import styles from "./PrivacyAttacks.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

export default function PrivacyAttacks() {
  return (
    <section className={styles["privacy-attacks"]}>
      <ContentBox height={652}>
        <Title title="Privacy Attacks" />
        <div className={styles.wrapper}></div>
      </ContentBox>
    </section>
  );
}
