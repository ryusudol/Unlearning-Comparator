import { useState, useContext } from "react";

import Unlearning from "../components/Unlearning";
import Defense from "../components/Defense";
import { useFetchModels } from "../hooks/useFetchModels";
import { SettingsIcon } from "../components/UI/icons";
import { ForgetClassContext } from "../store/forget-class-context";

type Mode = 0 | 1;

export default function Experiments({ height }: { height: number }) {
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  const [mode, setMode] = useState<Mode>(0);
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearnedModels, setUnlearnedModels] = useState<string[]>([]);

  useFetchModels(setTrainedModels, "trained_models");

  const handleConfigModeChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    setMode(+e.currentTarget.id as Mode);
  };

  const selectedFCExist = selectedForgetClasses.length !== 0;

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[342px] relative px-1 py-0.5 flex flex-col justify-start items-start border-[1px]"
    >
      <div className="w-full flex justify-between -mt-[1px]">
        <div className="flex items-center ml-0.5 mb-[1px]">
          <SettingsIcon className="scale-110" />
          <h5 className="font-semibold ml-1 text-lg">Model Builder</h5>
        </div>
        {selectedFCExist && (
          <div className="flex items-center border-[1px] px-2 relative top-[1px] rounded-t-[6px]">
            <button
              id="0"
              onClick={handleConfigModeChange}
              className={`relative text-base font-semibold py-0 mr-3 px-1 ${
                mode === 1 ? "text-gray-400" : ""
              }`}
            >
              Unlearning
              {mode === 0 && (
                <div className="absolute w-full h-0.5 bg-black right-0 bottom-0" />
              )}
            </button>
            <button
              id="1"
              onClick={handleConfigModeChange}
              className={`relative text-base font-semibold py-0 px-1 ${
                mode === 0 ? "text-gray-400" : ""
              }`}
            >
              Defense
              {mode === 1 && (
                <div className="absolute w-full h-0.5 bg-black right-0 bottom-0" />
              )}
            </button>
          </div>
        )}
      </div>
      {selectedFCExist ? (
        <div className="w-full h-56 py-1.5 px-2 rounded-b-[6px] rounded-tl-[6px] border-[1px] border-[rgba(0, 0, 0, 0.2)]">
          {mode === 0 ? (
            <Unlearning
              trainedModels={trainedModels}
              setUnlearnedModels={setUnlearnedModels}
            />
          ) : (
            <Defense unlearnedModels={unlearnedModels} />
          )}
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first from above.
        </div>
      )}
    </section>
  );
}
