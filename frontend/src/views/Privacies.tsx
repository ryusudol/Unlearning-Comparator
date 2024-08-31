import styles from "./Privacies.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

export default function Privacies() {
  return (
    <section className={styles["privacy-attacks"]}>
      <Title title="Privacies" />
      <ContentBox height={642}>
        <div className={styles.wrapper}></div>
      </ContentBox>
    </section>
  );
}
