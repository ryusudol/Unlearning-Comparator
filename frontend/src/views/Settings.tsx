import React from "react";

import Title from "../components/Title";
import TrainingConfiguration from "../components/TrainingConfiguration";
import UnlearningConfiguration from "../components/UnlearningConfiguration";
import DefenseConfiguration from "../components/DefenseConfiguration";

type PropsType = {
  setSvgContents: (data: string[]) => void;
};

export default function Settings({ setSvgContents }: PropsType) {
  return (
    <section>
      <Title title="Settings" />
      <TrainingConfiguration setSvgContents={setSvgContents} />
      <UnlearningConfiguration />
      <DefenseConfiguration />
    </section>
  );
}
