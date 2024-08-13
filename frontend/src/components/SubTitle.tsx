import styles from "./SubTitle.module.css";

type PropsType = {
  subtitle: string;
  fontSize?: number;
};

export default function SubTitle({ subtitle, fontSize }: PropsType) {
  return (
    <p className={styles.subtitle} style={{ fontSize: fontSize }}>
      {subtitle}
    </p>
  );
}
