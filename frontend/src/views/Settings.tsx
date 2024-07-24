import React, { useState, useEffect } from "react";

import Title from "../components/Title";
import TrainingConfiguration from "../components/TrainingConfiguration";
import UnlearningConfiguration from "../components/UnlearningConfiguration";
import DefenseConfiguration from "../components/DefenseConfiguration";

const API_URL = "http://localhost:8000";

type PropsType = {
  setOriginalSvgContents: (data: string[]) => void;
  setUnlearnedSvgContents: (data: string[]) => void;
};

export default function Settings({
  setOriginalSvgContents,
  setUnlearnedSvgContents,
}: PropsType) {
  const [trainedModels, setTrainedModels] = useState<string[]>([]);

  useEffect(() => {
    const func = async () => {
      try {
        const res = await fetch(`${API_URL}/trained_models`);
        if (!res.ok) {
          alert("Error occurred while fetching trained models.");
          return;
        }
        const json = await res.json();
        setTrainedModels(json);
      } catch (err) {
        console.log(err);
      }
    };
    func();
  }, []);

  return (
    <section>
      <Title title="Settings" />
      <TrainingConfiguration
        setTrainedModels={setTrainedModels}
        setOriginalSvgContents={setOriginalSvgContents}
      />
      <UnlearningConfiguration
        trainedModels={trainedModels}
        setUnlearnedSvgContents={setUnlearnedSvgContents}
      />
      <DefenseConfiguration />
    </section>
  );
}
