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

export default function Settings() {
  const [configMode, setConfigMode] = useState<Mode>(0); // 0: Training, 1: Unlearning, 2:Defense
  const [operationStatus, setOperationStatus] = useState<Mode>(0); // 0: Idle, 1: Predefined, 2: Custom
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearnedModels, setUnlearnedModels] = useState<string[]>([]);

  useFetchModels(setTrainedModels, "trained_models");

  const handleConfigModeChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    setConfigMode(+e.currentTarget.id as Mode);
  };

  return (
    <section className={styles.settings}>
      <Title title="Settings" />
      <ContentBox height={253}>
        <ConfigSelector
          mode={configMode}
          status={operationStatus}
          onClick={handleConfigModeChange}
        />
        {configMode === 0 ? (
          <Training
            operationStatus={operationStatus}
            setOperationStatus={setOperationStatus}
            setTrainedModels={setTrainedModels}
          />
        ) : configMode === 1 ? (
          <Unlearning
            operationStatus={operationStatus}
            setOperationStatus={setOperationStatus}
            trainedModels={trainedModels}
            setUnlearnedModels={setUnlearnedModels}
          />
        ) : (
          <Defense
            operationStatus={operationStatus}
            setOperationStatus={setOperationStatus}
            unlearnedModels={unlearnedModels}
          />
        )}
      </ContentBox>
    </section>
  );
}
