import { useContext, useState } from "react";

import { CIFAR_10_CLASSES } from "../../constants/common";
import { Experiment, Experiments } from "../../types/experiments-context";
import { ForgetClassContext } from "../../store/forget-class-context";
import { ExperimentsContext } from "../../store/experiments-context";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";
import ForgetClassTab from "./Tab";
import ForgetClassTabPlusButton from "./TabPlusButton";

export default function ForgetClassTabs() {
  const { selectedForgetClasses } = useContext(ForgetClassContext);
  const { saveExperiments, setIsExperimentsLoading } =
    useContext(ExperimentsContext);

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
      <ForgetClassTab
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
