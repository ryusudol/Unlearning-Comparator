import { useState } from "react";

import Tab from "./Tab";
import ForgetClassTabPlusButton from "./TabPlusButton";
import { Experiment, Experiments } from "../../types/data";
import { useClasses } from "../../hooks/useClasses";
import { useExperimentsStore } from "../../stores/experimentsStore";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { fetchAllExperimentsData } from "../../utils/api/modelScreening";

export default function Tabs() {
  const classes = useClasses();
  const saveExperiments = useExperimentsStore((state) => state.saveExperiments);
  const selectedForgetClasses = useForgetClassStore(
    (state) => state.selectedForgetClasses
  );
  const setIsExperimentsLoading = useExperimentsStore(
    (state) => state.setIsExperimentsLoading
  );

  const hasNoSelectedForgetClass = selectedForgetClasses.length === 0;

  const [open, setOpen] = useState(hasNoSelectedForgetClass);

  const fetchAndSaveExperiments = async (forgetClass: string) => {
    const classIndex = classes.indexOf(forgetClass);
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
    <div className="flex items-center gap-1 relative -bottom-[11px]">
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
