import { useContext, useState } from "react";

import { LogoIcon, PlusIcon } from "./UI/icons";
import { forgetClassNames } from "../constants/forgetClassNames";
import { Tabs, TabsList, TabsTrigger } from "./UI/tabs";
import { ForgetClassContext } from "../store/forget-class-context";
import { Label } from "./UI/label";
import { Button } from "./UI/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./UI/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./UI/select";

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
    <div className="w-full text-white bg-black h-12 flex justify-between items-center px-4 relative">
      <div>
        <div className="flex items-center relative">
          <div className="flex items-center">
            <LogoIcon className="w-7 h-7" />
            <span className="text-2xl font-semibold ml-2 mr-10">
              UnlearningComparator
            </span>
          </div>
          <Tabs
            className="relative -bottom-2.5 flex items-center"
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
                  className="h-[30px] rounded-b-none data-[state=active]:shadow-none"
                >
                  <span className="px-1 border-b-2 border-black text-base">
                    Forget Class: {forgetClassNames[selectedForgetClass]}
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
                <DialogTrigger className="w-8 h-[30px] flex justify-center items-center ml-1 mb-0.5 transition hover:bg-gray-800 rounded-t">
                  <PlusIcon className="w-3.5 h-3.5" color="#64758B" />
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
      <div className="ml-5 relative top-2 right-[284px] text-[13px]">
        <span className="mr-3">
          <strong>Dataset</strong>: CIFAR-10
        </span>
        <span>
          <strong>Model</strong>: Resnet18
        </span>
      </div>
    </div>
  );
}
