import { useContext } from "react";

import { forgetClassNames } from "../constants/forgetClassNames";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ForgetClassContext } from "../store/forget-class-context";

export default function Header() {
  const { forgetClass, saveForgetClass } = useContext(ForgetClassContext);

  return (
    <div className="w-full text-white bg-black h-16 flex justify-between items-center px-4 relative">
      <div>
        <div className="flex items-center relative">
          <span className="ml-2 text-4xl font-semibold mr-[106px]">
            Unforgettable
          </span>
          <div className="relative -bottom-3 -ml-[37.5px] flex items-center">
            <span className="text-lg">Forget:</span>
            <Tabs
              onValueChange={saveForgetClass}
              defaultValue={forgetClassNames[forgetClass]}
            >
              <TabsList className="bg-transparent">
                {forgetClassNames.map((name, idx) => (
                  <TabsTrigger
                    key={idx}
                    value={name}
                    className="h-10 rounded-b-none data-[state=active]:shadow-none"
                  >
                    <span className="px-1 border-b-2 border-black text-lg">
                      {name}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="ml-5 relative bottom-0.5">
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
