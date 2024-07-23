import React, { useState } from "react";

import Title from "../components/Title";
import TrainingConfiguration from "../components/TrainingConfiguration";
import UnlearningConfiguration from "../components/UnlearningConfiguration";
import DefenseConfiguration from "../components/DefenseConfiguration";

type PropsType = {
  setSvgContents: (data: string[]) => void;
};

export default function Settings({ setSvgContents }: PropsType) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <section>
      <Title title="Settings" />
      <TrainingConfiguration
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setSvgContents={setSvgContents}
      />
      <UnlearningConfiguration />
      <DefenseConfiguration />
    </section>
  );
}
