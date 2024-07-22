import React from "react";
import styles from "./Histories.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import Button from "../components/Button";

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
