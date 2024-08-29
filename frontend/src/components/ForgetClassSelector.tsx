import React, { useContext } from "react";
import styles from "./ForgetClassSelector.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAsterisk } from "@fortawesome/free-solid-svg-icons";

import { BaselineContext } from "../store/baseline-context";
import { UNLEARN_CLASSES } from "../constants/unlearning";

interface Props {
  width: number;
  isBaseline?: boolean;
}

export default function ForgetClassSelector({ width, isBaseline }: Props) {
  const { baseline, saveBaseline } = useContext(BaselineContext);

  const handleForgetClassSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveBaseline(+e.currentTarget.value);
  };

  return (
    <div style={{ width: `${width}px` }} className={styles.forget}>
      <div>
        <FontAwesomeIcon icon={faAsterisk} className={styles.asterisk} />
        <label htmlFor="forget-class">Forget Class</label>
      </div>
      <select
        onChange={isBaseline ? handleForgetClassSelect : undefined}
        name="forget_class"
        id="forget-class"
        value={baseline}
      >
        {UNLEARN_CLASSES.map((el, idx) => (
          <option key={idx} value={el}>
            {el}
          </option>
        ))}
      </select>
    </div>
  );
}
