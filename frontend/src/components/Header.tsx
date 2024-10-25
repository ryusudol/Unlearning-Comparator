import { useContext, useState } from "react";

import { LogoIcon } from "./ui/icons";
import { forgetClassNames } from "../constants/forgetClassNames";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ForgetClassContext } from "../store/forget-class-context";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function Header() {
  const {
    forgetClass,
    selectedForgetClasses,
    saveForgetClass,
    addSelectedForgetClass,
  } = useContext(ForgetClassContext);

  const unselectForgetClasses = forgetClassNames.filter(
    (item) => !selectedForgetClasses.includes(forgetClassNames.indexOf(item))
  );
  const [targetFC, setTargetFC] = useState(unselectForgetClasses[0]);
  const [open, setOpen] = useState(selectedForgetClasses.length === 0);

  const handleAddClick = () => {
    addSelectedForgetClass(targetFC);
    saveForgetClass(targetFC);
    setOpen(false);
  };

  return (
    <div className="w-full text-white bg-black h-16 flex justify-between items-center px-4 relative">
      <div>
        <div className="flex items-center relative">
          <div className="flex items-center">
            <LogoIcon className="w-10 h-10" />
            <span className="ml-2 text-4xl font-semibold mr-[106px]">
              Unforgettable
            </span>
          </div>
          <Tabs
            className="relative -bottom-3 -ml-7 flex items-center"
            onValueChange={saveForgetClass}
            value={
              forgetClass !== undefined ? forgetClassNames[forgetClass] : ""
            }
          >
            <TabsList className="bg-transparent">
              {selectedForgetClasses.map((selectedForgetClass, idx) => (
                <TabsTrigger
                  key={idx}
                  value={forgetClassNames[selectedForgetClass]}
                  className="h-10 rounded-b-none data-[state=active]:shadow-none"
                >
                  <span className="px-1 border-b-2 border-black text-lg">
                    {forgetClassNames[selectedForgetClass]}
                  </span>
                </TabsTrigger>
              ))}
              <Dialog
                open={open}
                onOpenChange={
                  selectedForgetClasses.length === 0
                    ? undefined
                    : (value: boolean) => {
                        setOpen(value);
                        setTargetFC(unselectForgetClasses[0]);
                      }
                }
              >
                <DialogTrigger className="w-8 h-10 ml-1 transition hover:bg-gray-800 rounded-t font-[roboto] text-3xl font-bold">
                  +
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      Which class do you want to unlearn?
                    </DialogTitle>
                    <DialogDescription>
                      Select a class that you want to unlearn. Click add when
                      you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 items-center gap-y-4">
                    <Label className="text-center">Forget Class</Label>
                    <Select defaultValue={targetFC} onValueChange={setTargetFC}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={targetFC} />
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
                    <Button onClick={handleAddClick}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="ml-5 relative top-3 right-[310px]">
        <span className="mr-3 text-[11px]">
          <strong>Dataset</strong>: CIFAR-10
        </span>
        <span className="text-[11px]">
          <strong>Model</strong>: Resnet18
        </span>
      </div>
    </div>
  );
}
