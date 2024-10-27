import { useContext, useState } from "react";

import DataTable from "../components/DataTable";
import Unlearning from "../components/Unlearning";
import Defense from "../components/Defense";
import { columns } from "../components/Columns";
import { Button } from "../components/UI/button";
import { SettingsIcon, RoboticIcon } from "../components/UI/icons";
import { overviewData } from "../constants/basicData";
import { ForgetClassContext } from "../store/forget-class-context";
import { performanceMetrics } from "../constants/overview";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/UI/tabs";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "../components/UI/dialog";

export default function PerformanceOverview({ height }: { height: number }) {
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  const [open, setOpen] = useState(false);
  const [trainedModels, setTrainedModels] = useState<string[]>([]);
  const [unlearnedModels, setUnlearnedModels] = useState<string[]>([]);

  const handleAddExpClick = () => {
    setOpen(true);
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex relative">
                <RoboticIcon className="scale-125 mr-1.5 relative bottom-[1px]" />
                <DialogTitle>Model Builder</DialogTitle>
              </div>
            </DialogHeader>
            <Tabs defaultValue="unlearning">
              <TabsList className="w-full bg-black mb-1.5">
                <TabsTrigger
                  className="w-full text-base py-1"
                  value="unlearning"
                >
                  Unlearning
                </TabsTrigger>
                <TabsTrigger className="w-full text-base py-1" value="defense">
                  Defense
                </TabsTrigger>
              </TabsList>
              <TabsContent className="h-[210px]" value="unlearning">
                <Unlearning
                  trainedModels={trainedModels}
                  setUnlearnedModels={setUnlearnedModels}
                />
              </TabsContent>
              <TabsContent className="h-[210px]" value="defense">
                <Defense unlearnedModels={unlearnedModels} />
              </TabsContent>
            </Tabs>
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
