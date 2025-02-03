import { useContext, useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../UI/dialog";
import UnlearningConfiguration from "./Unlearning";
import Button from "../CustomButton";
import { PlusIcon } from "../UI/icons";
import { RunningStatusContext } from "../../store/running-status-context";

export default function AddExperimentButton() {
  const { isRunning } = useContext(RunningStatusContext);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isRunning) setOpen(false);
  }, [isRunning]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
  };

  const handleAddExpClick = () => {
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger disabled={isRunning}>
        <Button
          onClick={handleAddExpClick}
          className={`px-2.5 mr-0.5 ${
            isRunning && "bg-gray-100 hover:bg-gray-100 cursor-not-allowed"
          }`}
        >
          <PlusIcon
            color={isRunning ? "#d1d5db" : "white"}
            className="w-2.5 h-2.5 mr-1.5"
          />
          <span className={isRunning ? "text-gray-300" : ""}>
            Add Experiment
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] p-4">
        <DialogHeader className="">
          <DialogTitle>Experiments</DialogTitle>
        </DialogHeader>
        <UnlearningConfiguration />
      </DialogContent>
    </Dialog>
  );
}
