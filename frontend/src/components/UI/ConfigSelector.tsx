import styles from "./ConfigSelector.module.css";

interface Props {
  mode: number;
  status: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigSelector({ mode, status, onClick }: Props) {
  return (
    <div className={styles.wrapper}>
      {["Training", "Unlearning", "Defense"].map((el, idx) => (
        <div>
          <button
            key={idx}
            disabled={status !== 0}
            onClick={onClick}
            id={idx.toString()}
            className={styles[mode === idx ? "selected-mode" : "mode-button"]}
          >
            {el}
          </button>
          {idx !== 2 && (
            <div
              className={styles[mode === idx ? "selected-arrow" : "arrow"]}
            />
          )}
        </div>
      ))}
    </div>
  );
}
