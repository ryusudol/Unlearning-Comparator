import React from "react";
import styles from "./Histories.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

export default function Histories() {
  const handleSaveBtnClick = () => {
    console.log("Save Button Clicked !");
  };

  return (
    <section>
      <Title title="Histories" />
      <ContentBox height={238}>
        <div onClick={handleSaveBtnClick} className={styles["button-wrapper"]}>
          Save
        </div>
      </ContentBox>
    </section>
  );
}
