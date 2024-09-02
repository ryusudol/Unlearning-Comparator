import styles from "./Privacies.module.css";

import Title from "../components/Title";
import SubTitle from "../components/SubTitle";
import ContentBox from "../components/ContentBox";

interface Props {
  height: number;
}

export default function Privacies({ height }: Props) {
  return (
    <section className={styles["privacy-attacks"]}>
      <Title title="Privacies" />
      <ContentBox height={height}>
        <div className={styles.wrapper}>
          <div className={styles["content-header"]}>
            <div>
              <SubTitle subtitle="Logit" fontSize={14} />
              <img
                className={styles["logit-img"]}
                src="/logit.png"
                alt="logit img"
              />
            </div>
            {/* <div>
              <SubTitle subtitle="MIA" fontSize={14} />
              <img
                className={styles["mia-img"]}
                src="/logit.png"
                alt="mia img"
              />
            </div> */}
          </div>
          <SubTitle subtitle="Attack" fontSize={14} />
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
