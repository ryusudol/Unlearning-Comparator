import styles from "./Input.module.css";

type PropsType = {
  labelName: string;
  defaultValue: string | number | undefined;
  optionData?: string[];
  type: "select" | "number";
  disabled?: boolean;
};

export default function Input({
  labelName,
  defaultValue,
  optionData,
  type,
  disabled,
}: PropsType) {
  const words = labelName.split(" ");
  const label = words.length < 3 ? labelName : `${words[1]} ${words[2]}`;
  const name = labelName.toLowerCase().replaceAll(" ", "_");

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={label}>
        {label}
      </label>
      {type === "select" ? (
        <select
          id={label}
          name={name}
          className={styles.input}
          defaultValue={defaultValue}
          disabled={disabled}
        >
          {optionData!.map((data, idx) => (
            <option key={idx} value={data}>
              {data}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={label}
          name={name}
          className={styles.input}
          defaultValue={defaultValue}
          placeholder="Please enter a value"
          type="number"
          step={labelName === "Learning Rate" ? 0.0001 : 1}
        />
      )}
    </div>
  );
}
