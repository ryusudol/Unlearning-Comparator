import styles from "./ConfigSelector.module.css";

interface Props {
  mode: number;
  status: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigSelector({ mode, status, onClick }: Props) {
  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.button} ${mode === 0 && styles.selected}`}
        onClick={onClick}
        id="0"
      >
        Training
      </button>
      <div
        className={`${styles["first-arrow"]} ${
          mode === 0 ? styles.white : styles.grey
        }`}
      />
      <button
        className={`${styles.button} ${mode === 1 && styles.selected}`}
        onClick={onClick}
        id="1"
      >
        <span>Unlearning</span>
      </button>
      <div
        className={`${styles["second-arrow"]} ${
          mode === 1 ? styles.white : styles.grey
        }`}
      />
      <button
        className={`${styles.button} ${mode === 2 && styles.selected}`}
        onClick={onClick}
        id="2"
      >
        <span>Defense</span>
      </button>
    </div>
  );
}
