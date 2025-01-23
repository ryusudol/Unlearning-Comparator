import { useContext, useState, useMemo, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../UI/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";
import {
  FORGET_CLASS_NAMES,
  DATASETS,
  NEURAL_NETWORK_MODELS,
} from "../../constants/common";
import { PlusIcon } from "../UI/icons";
import { Experiments } from "../../types/experiments-context";
import { ForgetClassContext } from "../../store/forget-class-context";
import { ExperimentsContext } from "../../store/experiments-context";
import { DatasetContext } from "../../store/dataset-context";
import { NeuralNetworkModelContext } from "../../store/neural-network-model-context";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";
import { Label } from "../UI/label";
import ForgetClassTab from "./ForgetClassTab";
import Button from "../CustomButton";

export default function ForgetClassTabs() {
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

interface HeaderModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  fetchAndSaveExperiments: (forgetClass: string) => Promise<void>;
  hasNoSelectedForgetClass: boolean;
}

function ForgetClassTabPlusButton({
  open,
  setOpen,
  fetchAndSaveExperiments,
  hasNoSelectedForgetClass,
}: HeaderModalProps) {
  const { addSelectedForgetClass, saveForgetClass, selectedForgetClasses } =
    useContext(ForgetClassContext);
  const { saveDataset } = useContext(DatasetContext);
  const { saveNeuralNetworkModel } = useContext(NeuralNetworkModelContext);

  const unselectForgetClasses = useMemo(
    () =>
      FORGET_CLASS_NAMES.filter(
        (item) =>
          !selectedForgetClasses.includes(FORGET_CLASS_NAMES.indexOf(item))
      ),
    [selectedForgetClasses]
  );

  useEffect(() => {
    setSelectedForgetClass(unselectForgetClasses[0]);
  }, [unselectForgetClasses]);

  const [selectedForgetClass, setSelectedForgetClass] = useState(
    unselectForgetClasses[0]
  );
  const [selectedDataset, setSelectedDataset] = useState(DATASETS[0]);
  const [selectedNeuralNetworkModel, setSelectedNeuralNetworkModel] = useState(
    NEURAL_NETWORK_MODELS[0]
  );

  const handleButtonClick = async () => {
    addSelectedForgetClass(selectedForgetClass);
    saveForgetClass(selectedForgetClass);
    saveDataset(selectedDataset);
    saveNeuralNetworkModel(selectedNeuralNetworkModel);

    setOpen(false);

    await fetchAndSaveExperiments(selectedForgetClass);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        hasNoSelectedForgetClass
          ? undefined
          : (value: boolean) => {
              setOpen(value);
              setSelectedForgetClass(unselectForgetClasses[0]);
            }
      }
    >
      <DialogTrigger className="w-8 h-[30px] flex justify-center items-center mb-0.5 transition hover:bg-gray-800 rounded-t">
        <PlusIcon className="w-3.5 h-3.5" color="#64758B" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[320px] p-4">
        <DialogHeader>
          <DialogTitle>Unlearning Comparator</DialogTitle>
          <DialogDescription>
            <p>
              Select {hasNoSelectedForgetClass && "a dataset, a model, and "}a
              forget class to visualize the outcomes of unlearning experiments.
            </p>
            {hasNoSelectedForgetClass && (
              <div className="grid grid-cols-2 gap-y-4 text-black mt-4">
                <div className="flex flex-col items-start">
                  <Label className="text-xs text-muted-foreground text-nowrap mb-0.5">
                    Dataset
                  </Label>
                  <Select
                    value={selectedDataset}
                    onValueChange={setSelectedDataset}
                  >
                    <SelectTrigger className="w-11/12">
                      <SelectValue placeholder={selectedDataset} />
                    </SelectTrigger>
                    <SelectContent>
                      {DATASETS.map((dataset) => (
                        <SelectItem key={dataset} value={dataset}>
                          {dataset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col items-start">
                  <Label className="text-xs text-muted-foreground text-nowrap mb-0.5">
                    Model
                  </Label>
                  <Select
                    value={selectedNeuralNetworkModel}
                    onValueChange={setSelectedNeuralNetworkModel}
                  >
                    <SelectTrigger className="w-11/12">
                      <SelectValue placeholder={selectedNeuralNetworkModel} />
                    </SelectTrigger>
                    <SelectContent>
                      {NEURAL_NETWORK_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-start">
          <Label className="text-xs text-muted-foreground text-center text-nowrap mb-0.5">
            Forget Class
          </Label>
          <Select
            value={selectedForgetClass}
            onValueChange={setSelectedForgetClass}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedForgetClass} />
            </SelectTrigger>
            <SelectContent>
              {unselectForgetClasses.map((forgetClass) => (
                <SelectItem key={forgetClass} value={forgetClass}>
                  {forgetClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            onClick={handleButtonClick}
            content={hasNoSelectedForgetClass ? "Apply" : "Add"}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
