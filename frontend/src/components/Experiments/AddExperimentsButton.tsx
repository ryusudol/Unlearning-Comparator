import { useContext, useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../UI/dialog";
import UnlearningConfiguration from "./UnlearningConfiguration";
import Button from "../CustomButton";
import { PlusIcon } from "../UI/icons";
import { RunningStatusContext } from "../../stores/running-status-context";

export default function AddExperimentsButton() {
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
            className="w-4 h-4 mr-1.5"
          />
          <span className={`text-[17px] ${isRunning && "text-gray-300"}`}>
            Generate Models
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-fit min-w-[340px] p-4">
        <DialogHeader>
          <DialogTitle>Experiments</DialogTitle>
        </DialogHeader>
        <UnlearningConfiguration />
      </DialogContent>
    </Dialog>
  );
}
