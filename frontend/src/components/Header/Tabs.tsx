import { useState } from "react";

import Tab from "./Tab";
import ForgetClassTabPlusButton from "./TabPlusButton";
import { CIFAR_10_CLASSES } from "../../constants/common";
import { Experiment, Experiments } from "../../types/data";
import { useExperimentsStore } from "../../stores/experimentsStore";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";

export default function Tabs() {
  const { selectedForgetClasses } = useForgetClassStore();
  const { saveExperiments, setIsExperimentsLoading } = useExperimentsStore();

  const hasNoSelectedForgetClass = selectedForgetClasses.length === 0;

  const [open, setOpen] = useState(hasNoSelectedForgetClass);

  const fetchAndSaveExperiments = async (forgetClass: string) => {
    const classIndex = CIFAR_10_CLASSES.indexOf(forgetClass);
    setIsExperimentsLoading(true);
    try {
      const allData: Experiments = await fetchAllExperimentsData(classIndex);

      if ("detail" in allData) {
        saveExperiments({});
      } else {
        Object.values(allData).forEach((experiment: Experiment) => {
          if (experiment && "points" in experiment) {
            delete experiment.points;
          }
        });
        saveExperiments(allData);
      }
    } finally {
      setIsExperimentsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 relative -bottom-2.5">
      <Tab
        setOpen={setOpen}
        fetchAndSaveExperiments={fetchAndSaveExperiments}
      />
      <ForgetClassTabPlusButton
        open={open}
        setOpen={setOpen}
        fetchAndSaveExperiments={fetchAndSaveExperiments}
        hasNoSelectedForgetClass={hasNoSelectedForgetClass}
      />
    </div>
  );
}
