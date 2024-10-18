import { useContext } from "react";

import { forgetClassNames } from "../constants/forgetClassNames";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ForgetClassContext } from "../store/forget-class-context";

export default function Header() {
  const { forgetClass, saveForgetClass } = useContext(ForgetClassContext);

  return (
    <div className="w-full text-white bg-black h-16 flex justify-between items-center px-4">
      <div>
        <div className="flex items-center relative">
          <span className="ml-2 text-4xl font-semibold mr-[106px]">
            Unforgettable
          </span>
          <Tabs
            onValueChange={saveForgetClass}
            defaultValue={forgetClass}
            className="relative -bottom-5"
          >
            <TabsList className="bg-transparent">
              {forgetClassNames.map((name, idx) => (
                <TabsTrigger
                  key={idx}
                  value={name}
                  className="rounded-b-none data-[state=active]:shadow-none pb-0.5 pt-0.5"
                >
                  <span className="px-1 border-b-2 border-black">{name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="ml-5 h-9 flex items-end">
        <span className="mr-3 text-[11px]">
          <strong>Model</strong>: Resnet18
        </span>
        <span className="text-[11px]">
          <strong>Dataset</strong>: CIFAR-10
        </span>
      </div>
    </div>
  );
}
