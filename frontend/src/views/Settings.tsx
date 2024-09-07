import { useState } from "react";
import styles from "./Settings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import ConfigSelector from "../components/UI/ConfigSelector";
import Training from "../components/UI/Training";
import Unlearning from "../components/UI/Unlearning";
import Defense from "../components/UI/Defense";
import { useFetchModels } from "../hooks/useFetchModels";

type Mode = 0 | 1 | 2;

interface Props {
  height: number;
}

export default function Settings({ height }: Props) {
  const [configMode, setConfigMode] = useState<Mode>(0); // 0: Training, 1: Unlearning, 2:Defense
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearnedModels, setUnlearnedModels] = useState<string[]>([]);

  useFetchModels(setTrainedModels, "trained_models");

  const handleConfigModeChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    setConfigMode(+e.currentTarget.id as Mode);
  };

  return (
    <section className={styles.settings}>
      <Title title="Settings" />
      <ContentBox height={height}>
        <ConfigSelector mode={configMode} onClick={handleConfigModeChange} />
        {configMode === 0 ? (
          <Training setTrainedModels={setTrainedModels} />
        ) : configMode === 1 ? (
          <Unlearning
            trainedModels={trainedModels}
            setUnlearnedModels={setUnlearnedModels}
          />
        ) : (
          <Defense unlearnedModels={unlearnedModels} />
        )}
      </ContentBox>
    </section>
  );
}
