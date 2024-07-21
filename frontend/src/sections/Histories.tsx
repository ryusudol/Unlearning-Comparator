import React from "react";
import styles from "./Histories.module.css";

import Title from "../views/Title";
import ContentBox from "../views/ContentBox";
import Button from "../views/Button";

export default function Histories() {
  return (
    <section>
      <Title title="Histories" />
      <ContentBox height={238}>
        <Button buttonText="Save" />
      </ContentBox>
    </section>
  );
}
