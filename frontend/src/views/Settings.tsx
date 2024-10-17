import { useState } from "react";

import ConfigSelector from "../components/ConfigSelector";
import Training from "../components/Training";
import Unlearning from "../components/Unlearning";
import Defense from "../components/Defense";
import { useFetchModels } from "../hooks/useFetchModels";
import { SettingsIcon } from "../components/ui/icons";

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
      className="w-[330px] relative px-[5px] py-0.5 flex flex-col justify-start items-start border-[1px] border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="w-full flex justify-between">
        <div className="flex items-center">
          <SettingsIcon />
          <h5 className="font-semibold ml-[3px] text-lg">Settings</h5>
        </div>
        <ConfigSelector mode={configMode} onClick={handleConfigModeChange} />
      </div>
      <div className="w-full h-[257px] py-[6px] px-[10px] rounded-b-[6px] rounded-tl-[6px] border-[1px] border-[rgba(0, 0, 0, 0.2)]">
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
