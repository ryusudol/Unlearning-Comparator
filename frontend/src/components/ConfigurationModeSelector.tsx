import styles from "./ConfigurationModeSelector.module.css";

interface Props {
  mode: number;
  status: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigurationModeSelector({
  mode,
  status,
  onClick,
}: Props) {
  return (
    <div className={styles["mode-button-wrapper"]}>
      <button
        disabled={status !== 0}
        onClick={onClick}
        id="0"
        className={styles[mode === 0 ? "selected-mode" : "mode-button"]}
      >
        Training
      </button>
      <button
        disabled={status !== 0}
        onClick={onClick}
        id="1"
        className={styles[mode === 1 ? "selected-mode" : "mode-button"]}
      >
        Unlearning
      </button>
      <button
        disabled={status !== 0}
        onClick={onClick}
        id="2"
        className={styles[mode === 2 ? "selected-mode" : "mode-button"]}
      >
        Defense
      </button>
    </div>
  );
}
