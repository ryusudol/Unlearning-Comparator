import { useState, useEffect } from "react";

import UnlearningConfiguration from "./UnlearningConfiguration";
import Button from "../CustomButton";
import { PlusIcon } from "../UI/icons";
import { useRunningStatusStore } from "../../stores/runningStatusStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../UI/dialog";

export default function AddExperimentsButton() {
  const { isRunning } = useRunningStatusStore();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isRunning) setOpen(false);
  }, [isRunning]);

  return (
    <Dialog open={open} onOpenChange={(val: boolean) => setOpen(val)}>
      <DialogTrigger disabled={isRunning}>
        <Button
          onClick={() => setOpen(true)}
          className={`w-[255px] mb-1 ${
            isRunning && "hover:bg-[#585858] cursor-not-allowed"
          }`}
        >
          <PlusIcon color="white" className="w-3 h-3 mr-1.5" />
          <span className="text-base font-medium">Open Model Builder</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-fit min-w-[340px] p-4">
        <DialogHeader>
          <DialogTitle>Model Builder</DialogTitle>
        </DialogHeader>
        <UnlearningConfiguration />
      </DialogContent>
    </Dialog>
  );
}
