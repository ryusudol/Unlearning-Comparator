import { useContext, useState } from "react";

import { FORGET_CLASS_NAMES } from "../../constants/common";
import { Experiments } from "../../types/experiments-context";
import { ForgetClassContext } from "../../store/forget-class-context";
import { ExperimentsContext } from "../../store/experiments-context";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";
import ForgetClassTab from "./Tab";
import ForgetClassTabPlusButton from "./TabPlusButton";

export default function ForgetClassSection() {
  const { selectedForgetClasses } = useContext(ForgetClassContext);
  const { saveExperiments, setIsExperimentsLoading } =
    useContext(ExperimentsContext);

  const hasNoSelectedForgetClass = selectedForgetClasses.length === 0;

  const [open, setOpen] = useState(hasNoSelectedForgetClass);

  const fetchAndSaveExperiments = async (forgetClass: string) => {
    const classIndex = FORGET_CLASS_NAMES.indexOf(forgetClass);
    setIsExperimentsLoading(true);
    try {
      const allData: Experiments = await fetchAllExperimentsData(classIndex);
      if ("detail" in allData) saveExperiments({});
      else saveExperiments(allData);
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
