import styles from "./RunButton.module.css";

interface Props {
  operationStatus: number;
  disabled?: boolean;
}

export default function RunButton({ operationStatus, disabled }: Props) {
  return (
    <button
      className={styles[disabled ? "button-disabled" : "button"]}
      disabled={disabled}
    >
      {operationStatus ? "Cancel" : "Run"}
    </button>
  );
}
