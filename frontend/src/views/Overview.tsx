import React, { useContext, useState } from "react";

import DataTable from "../components/DataTable";
import Unlearning from "../components/Unlearning";
import Defense from "../components/Defense";
import { columns } from "../components/Columns";
import { Button } from "../components/UI/button";
import { SettingsIcon } from "../components/UI/icons";
import { overviewData } from "../constants/basicData";
import { ForgetClassContext } from "../store/forget-class-context";
import { performanceMetrics } from "../constants/overview";
import { Dialog, DialogContent, DialogTrigger } from "../components/UI/dialog";

const UNLEARNING = "unlearning";
const DEFENSE = "defense";

type ModeType = "unlearning" | "defense";

export default function PerformanceOverview({ height }: { height: number }) {
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModeType>(UNLEARNING);
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearnedModels, setUnlearnedModels] = useState<string[]>([]);

  const isUnlearning = mode === UNLEARNING;
  const isDefense = mode === DEFENSE;

  const handleAddExpClick = () => {
    setOpen(true);
  };

  const handleExperimentModeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    setMode(e.currentTarget.id as ModeType);
  };

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[1210px] p-1 relative border-x-[1px] border-b-[1px]"
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center ml-0.5">
          <SettingsIcon className="scale-110" />
          <h5 className="font-semibold ml-1 text-lg">Experiments</h5>
        </div>
        <Dialog
          open={open}
          onOpenChange={(value: boolean) => {
            setOpen(value);
          }}
        >
          <DialogTrigger onClick={handleAddExpClick}>
            <Button className="h-[30px] px-3 mr-0.5">Add Experiment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <div className="w-full flex items-center mt-2">
              <div
                id={UNLEARNING}
                onClick={handleExperimentModeChange}
                className={`w-full h-8 relative flex items-center cursor-pointer ${
                  isDefense && "text-gray-400"
                }`}
              >
                <button className="font-semibold w-full">Unlearning</button>
                <div
                  className={`absolute w-full h-0.5 bg-black bottom-0 ${
                    isDefense && "bg-gray-400 h-[1px]"
                  }`}
                />
              </div>
              <div
                id={DEFENSE}
                onClick={handleExperimentModeChange}
                className={`w-full h-8 relative flex items-center cursor-pointer ${
                  isUnlearning && "text-gray-400"
                }`}
              >
                <button className="font-semibold w-full">Defense</button>
                <div
                  className={`absolute w-full h-0.5 bg-black bottom-0 ${
                    isUnlearning && "bg-gray-400 h-[1px]"
                  }`}
                />
              </div>
            </div>
            <div className="h-[220px]">
              {isUnlearning ? (
                <Unlearning
                  trainedModels={trainedModels}
                  setUnlearnedModels={setUnlearnedModels}
                />
              ) : (
                <Defense unlearnedModels={unlearnedModels} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {selectedForgetClasses.length === 0 ? (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first from above.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={overviewData}
          performanceMetrics={performanceMetrics}
        />
      )}
    </section>
  );
}
