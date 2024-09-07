import styles from "./Privacies.module.css";

import ContentBox from "../components/ContentBox";

interface Props {
  height: number;
}

export default function Privacies({ height }: Props) {
  return (
    <section className={styles["privacy-attacks"]}>
      <ContentBox height={height}>
        <div className={styles.wrapper}>
          <div className={styles["content-header"]}>
            <img
              className={styles["logit-img"]}
              src="/logit.png"
              alt="logit img"
            />
            <img className={styles["mia-img"]} src="/mia.png" alt="mia img" />
          </div>
          <img
            className={styles["attack-img"]}
            src="/attack.png"
            alt="attack img"
          />
        </div>
      </ContentBox>
    </section>
  );
}
