import ClassButtons from "./ClassButtons";
import ClassPlusButton from "./ClassPlusButton";
import { Experiment, Experiments } from "../../types/data";
import { useClasses } from "../../hooks/useClasses";
import { useDatasetMode } from "../../hooks/useDatasetMode";
import { useExperimentsStore } from "../../stores/experimentsStore";
import { fetchAllExperimentsData } from "../../utils/api/modelScreening";

interface ClassSelectionProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function ClassSelection({ open, setOpen }: ClassSelectionProps) {
  const classes = useClasses();
  const datasetMode = useDatasetMode();

  const saveExperiments = useExperimentsStore((state) => state.saveExperiments);
  const setIsExperimentsLoading = useExperimentsStore(
    (state) => state.setIsExperimentsLoading
  );

  const fetchAndSaveExperiments = async (forgetClass: string) => {
    const classIndex = classes.indexOf(forgetClass);
    setIsExperimentsLoading(true);
    try {
      const allData: Experiments = await fetchAllExperimentsData(
        datasetMode,
        classIndex
      );

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
      <ClassButtons
        setOpen={setOpen}
        fetchAndSaveExperiments={fetchAndSaveExperiments}
      />
      <ClassPlusButton
        open={open}
        setOpen={setOpen}
        fetchAndSaveExperiments={fetchAndSaveExperiments}
      />
    </div>
  );
}
