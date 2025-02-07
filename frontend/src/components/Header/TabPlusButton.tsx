import { useContext, useMemo, useEffect, useState } from "react";

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
  CIFAR_10_CLASSES,
  DATASETS,
  NEURAL_NETWORK_MODELS,
} from "../../constants/common";
import { DatasetAndModelContext } from "../../store/dataset-and-model-context";
import { ForgetClassContext } from "../../store/forget-class-context";
import { Label } from "../UI/label";
import { PlusIcon } from "../UI/icons";
import Button from "../CustomButton";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  fetchAndSaveExperiments: (forgetClass: string) => Promise<void>;
  hasNoSelectedForgetClass: boolean;
}

export default function ForgetClassTabPlusButton({
  open,
  setOpen,
  fetchAndSaveExperiments,
  hasNoSelectedForgetClass,
}: Props) {
  const { addSelectedForgetClass, saveForgetClass, selectedForgetClasses } =
    useContext(ForgetClassContext);
  const { saveDataset, saveNeuralNetworkModel } = useContext(
    DatasetAndModelContext
  );

  const unselectForgetClasses = useMemo(
    () =>
      CIFAR_10_CLASSES.filter(
        (item) =>
          !selectedForgetClasses.includes(CIFAR_10_CLASSES.indexOf(item))
      ),
    [selectedForgetClasses]
  );

  const [forgetClass, setForgetClass] = useState(unselectForgetClasses[0]);
  const [dataset, setDataset] = useState(DATASETS[0]);
  const [neuralNetworkModel, setNeuralNetworkModel] = useState(
    NEURAL_NETWORK_MODELS[0]
  );

  useEffect(() => {
    setForgetClass(unselectForgetClasses[0]);
  }, [unselectForgetClasses]);

  const handleButtonClick = async () => {
    addSelectedForgetClass(forgetClass);
    saveForgetClass(forgetClass);
    saveDataset(dataset);
    saveNeuralNetworkModel(neuralNetworkModel);

    setOpen(false);

    await fetchAndSaveExperiments(forgetClass);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        hasNoSelectedForgetClass
          ? undefined
          : (value: boolean) => {
              setOpen(value);
              setForgetClass(unselectForgetClasses[0]);
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
                  <Select value={dataset} onValueChange={setDataset}>
                    <SelectTrigger className="w-11/12">
                      <SelectValue placeholder={dataset} />
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
                    value={neuralNetworkModel}
                    onValueChange={setNeuralNetworkModel}
                  >
                    <SelectTrigger className="w-11/12">
                      <SelectValue placeholder={neuralNetworkModel} />
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
          <Select value={forgetClass} onValueChange={setForgetClass}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={forgetClass} />
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
          <Button onClick={handleButtonClick}>
            {hasNoSelectedForgetClass ? "Apply" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
