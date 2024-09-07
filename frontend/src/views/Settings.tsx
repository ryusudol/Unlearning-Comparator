import { useState } from "react";

import ConfigSelector from "../components/UI/ConfigSelector";
import Training from "../components/UI/Training";
import Unlearning from "../components/UI/Unlearning";
import Defense from "../components/UI/Defense";
import { useFetchModels } from "../hooks/useFetchModels";
import { SettingsIcon } from "../components/UI/icons";

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
    <section
      style={{ height: `${height}px` }}
      className="w-[330px] relative px-[6px] py-[3px] flex flex-col justify-start items-start border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <SettingsIcon />
          <h5 className="font-semibold ml-[3px]">Settings</h5>
        </div>
        <ConfigSelector mode={configMode} onClick={handleConfigModeChange} />
      </div>
      <div className="w-full h-[226px] py-[6px] px-[10px] rounded-[6px] border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]">
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
      </div>
    </section>
  );
}
