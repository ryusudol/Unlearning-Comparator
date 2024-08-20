import { useState } from "react";
import styles from "./Settings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import ConfigSelector from "../components/UI/ConfigSelector";
import Training from "../components/UI/Training";
import Unlearning from "../components/UI/Unlearning";
import Defense from "../components/UI/Defense";
import { useFetchModels } from "../hooks/useFetchModels";

export default function Settings() {
  const [mode, setMode] = useState(0); // 0: Training, 1: Unlearning, 2:Defense
  const [operationStatus, setOperationStatus] = useState(0); // 0: Idle, 1: Predefined, 2: Custom
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearnedModels, setUnlearnedModels] = useState<string[]>([]);

  useFetchModels(setTrainedModels, "trained_models");

  const handleConfigModeChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    setMode(+e.currentTarget.id);
  };

  return (
    <section className={styles.settings}>
      <ContentBox height={275}>
        <Title title="Settings" />
        <ConfigSelector
          mode={mode}
          status={operationStatus}
          onClick={handleConfigModeChange}
        />
        {mode === 0 ? (
          <Training
            operationStatus={operationStatus}
            setOperationStatus={setOperationStatus}
            setTrainedModels={setTrainedModels}
          />
        ) : mode === 1 ? (
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
