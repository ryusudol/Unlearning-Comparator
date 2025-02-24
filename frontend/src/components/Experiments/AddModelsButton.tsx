import { useState, useEffect } from "react";

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
import { useRunningStatusStore } from "../../stores/runningStatusStore";

export default function AddExperimentsButton() {
  const { isRunning } = useRunningStatusStore();

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
          className={`px-3.5 py-4 relative bottom-0.5 ${
            isRunning && "bg-gray-100 hover:bg-gray-100 cursor-not-allowed"
          }`}
        >
          <PlusIcon
            color={isRunning ? "#d1d5db" : "white"}
            className="w-3 h-3 mr-1.5"
          />
          <span className={`text-base ${isRunning && "text-gray-300"}`}>
            Add Models
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
