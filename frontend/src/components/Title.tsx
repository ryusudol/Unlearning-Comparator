import styles from "./Title.module.css";

type PropsType = {
  title: string;
};

export default function Title({ title }: PropsType) {
  return (
    <div className={styles.title}>
      <h4>{title}</h4>
      <div />
    </div>
  );
}
