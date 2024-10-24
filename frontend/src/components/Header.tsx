import { useContext } from "react";

import { LogoIcon } from "./ui/icons";
import { forgetClassNames } from "../constants/forgetClassNames";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ForgetClassContext } from "../store/forget-class-context";

export default function Header() {
  const { forgetClass, saveForgetClass } = useContext(ForgetClassContext);

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
          <div className="relative -bottom-3 -ml-7 flex items-center">
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
                <TabsTrigger
                  value=""
                  className="h-10 rounded-b-none data-[state=active]:shadow-none"
                >
                  <span className="px-1 border-b-2 border-black text-lg">
                    +
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
