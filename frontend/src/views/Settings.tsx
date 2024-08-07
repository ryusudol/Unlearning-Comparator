import { useState, useEffect } from "react";
import styles from "./Settings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import TrainingConfiguration from "../components/TrainingConfiguration";
import UnlearningConfiguration from "../components/UnlearningConfiguration";
import DefenseConfiguration from "../components/DefenseConfiguration";

const API_URL = "http://localhost:8000";

export default function Settings() {
  const [configurationMode, setConfigurationMode] = useState(0); // 0: Training, 1: Unlearning, 2:Defense
  const [isRunning, setIsRunning] = useState(0);
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

  const handleConfigurationModeChange = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    setConfigurationMode(+e.currentTarget.id);
  };

  return (
    <section>
      <Title title="Settings" />
      <ContentBox height={252}>
        <div className={styles["mode-button-wrapper"]}>
          <button
            disabled={isRunning !== 0}
            onClick={handleConfigurationModeChange}
            id="0"
            className={
              styles[configurationMode === 0 ? "selected-mode" : "mode-button"]
            }
          >
            Training
          </button>
          <button
            disabled={isRunning !== 0}
            onClick={handleConfigurationModeChange}
            id="1"
            className={
              styles[configurationMode === 1 ? "selected-mode" : "mode-button"]
            }
          >
            Unlearning
          </button>
          <button
            disabled={isRunning !== 0}
            onClick={handleConfigurationModeChange}
            id="2"
            className={
              styles[configurationMode === 2 ? "selected-mode" : "mode-button"]
            }
          >
            Defense
          </button>
        </div>
        {configurationMode === 0 ? (
          <TrainingConfiguration
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            setTrainedModels={setTrainedModels}
          />
        ) : configurationMode === 1 ? (
          <UnlearningConfiguration
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            trainedModels={trainedModels}
          />
        ) : (
          <DefenseConfiguration />
        )}
      </ContentBox>
    </section>
  );
}
