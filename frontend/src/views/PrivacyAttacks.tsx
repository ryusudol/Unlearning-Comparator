import styles from "./PrivacyAttacks.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

export default function PrivacyAttacks() {
  return (
    <section className={styles["privacy-attacks"]}>
      <Title title="Privacy Attacks" />
      <ContentBox height={627}>
        <div className={styles.wrapper}></div>
      </ContentBox>
    </section>
  );
}
