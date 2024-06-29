import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import styles from "./SelectFromSubInput.module.css";

import SelectInput from "./SelectInput";
import ManualInput from "./ManualInput";
import { METHODS } from "../constants/methods";

type InputTypes = "select" | "file";

type PropsType = {
  name: string;
  subNames: string[];
  subTypes: InputTypes[];
  optionData?: string[][];
};

export default function SelectFromSubInput({
  name,
  subNames,
  subTypes,
  optionData,
}: PropsType) {
  const [selected, setSelected] = useState(0);

  const onIconClick = (e: React.MouseEvent) => {
    const selectedIdx = parseInt(e.currentTarget.id);
    setSelected(selectedIdx);
  };

  return (
    <div>
      <span>{name}</span>
      {subTypes.map((type, idx) => (
        <div
          onClick={onIconClick}
          className={styles["subinput-wrapper"]}
          id={idx.toString()}
        >
          {selected === idx ? (
            <FontAwesomeIcon
              icon={faCircleCheck}
              size="sm"
              className={styles.icons}
            />
          ) : (
            <FontAwesomeIcon
              icon={faCircle}
              size="sm"
              className={styles.icons}
            />
          )}
          {type === "select" ? (
            <SelectInput
              labelName={subNames[idx]}
              optionData={METHODS}
              labelFontSize="sm"
            />
          ) : (
            <ManualInput
              labelName={subNames[idx]}
              type={type}
              labelFontSize="sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}
