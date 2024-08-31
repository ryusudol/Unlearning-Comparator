import styles from "./RunButton.module.css";

interface Props {
  isRunning: boolean;
}

export default function RunButton({ isRunning }: Props) {
  return (
    <button className={styles.button}>{isRunning ? "Cancel" : "Run"}</button>
  );
}
