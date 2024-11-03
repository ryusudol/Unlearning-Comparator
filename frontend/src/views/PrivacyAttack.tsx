import { useState } from "react";

import { Slider } from "../components/UI/slider";
import { Button } from "../components/UI/button";
import { Label } from "../components/UI/label";
import { Input } from "../components/UI/input";
import { Separator } from "../components/UI/separator";
import { HelpCircleIcon } from "../components/UI/icons";
import {
  Image01Icon,
  UserQuestion01Icon,
  ImageDelete01Icon,
  NeuralNetworkIcon,
  GitCompareIcon,
} from "../components/UI/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/UI/select";

export default function PrivacyAttack({ height }: { height: number }) {
  const [selected, setSelected] = useState([0.5]);
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ height: `${height}px` }}
      className="w-[1428px] h-[683px] flex justify-evenly items-center border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]"
    >
      <div className="w-[155px] h-[660px] flex flex-col justify-center items-center">
        {/* Legend - Metadata */}
        <div className="w-[155px] h-[104px] flex flex-col justify-start items-start mb-[5px] px-2 py-2 border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <div className="flex items-center">
            <span className="text-[15px] mr-1">Metadata</span>
            <HelpCircleIcon className="cursor-pointer" />
          </div>
          <div className="flex flex-col justify-start items-start">
            <span className="text-[15px] font-light">Images: 1000</span>
            <span className="text-[15px] font-light">Class: 5 (dog)</span>
            <span className="text-[15px] font-light">Dataset: Training</span>
          </div>
        </div>
        {/* Legend - Preview */}
        <div className="w-[155px] h-[175px] flex flex-col justify-start items-start mb-[5px] px-2 py-2 border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span className="text-[15px]">Preview</span>
          <img src="/dog.png" alt="dog img" />
        </div>
        {/* Legend - ???? */}
        <div className="w-[155px] h-[120px] flex flex-col justify-start items-start mb-[5px] px-2 py-2 border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <span className="text-[15px]">????</span>
        </div>
        {/* Legend - Configuration */}
        <div className="w-[155px] h-[250px] flex flex-col justify-between items-start pl-2 pr-[2px] py-2 border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] rounded-[6px]">
          <div>
            <span className="text-[15px]">Configuration</span>
            <div className="flex flex-col justify-start items-start font-light">
              <span className="text-[14px] font-light">Selected Images: ?</span>
              <span className="text-[14px] font-light">
                Membership Inference
              </span>
              <span className="text-[14px] font-light">Reconstruction</span>
              <div className="flex flex-col ml-3">
                <div className="flex justify-between items-center ">
                  <Label className="text-sm text-[13px]" htmlFor="iterations">
                    Iterations
                  </Label>
                  <Input
                    id="iterations"
                    type="number"
                    className="w-[52px] h-[18px] px-2 text-sm overflow-ellipsis whitespace-nowrap ml-[5px]"
                    defaultValue={10000}
                  />
                </div>
                <div className="flex justify-between items-center ">
                  <Label
                    className="text-sm text-[13px]"
                    htmlFor="learning-rate"
                  >
                    Learning Rate
                  </Label>
                  <Input
                    id="learning-rate"
                    type="number"
                    className="w-[52px] h-[18px] px-2 text-sm overflow-ellipsis whitespace-nowrap ml-[5px]"
                    defaultValue={0.001}
                  />
                </div>
              </div>
            </div>
          </div>
          <Button className="w-12 h-6 relative -right-[90px]">Run</Button>
        </div>
      </div>
      <Separator
        orientation="vertical"
        className="h-[660px] w-[1px] mx-[2px]"
      />
      <div className="w-[680px] h-[660px] flex flex-col justify-start items-center relative">
        <div className="w-full flex justify-between items-start mb-2">
          <div className="flex items-center">
            <Image01Icon />
            <h5 className="text-[15px] ml-1">Instances</h5>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-6">
              <span className="text-[13px] font-light">Selected</span>
              <div className="flex items-center">
                <Slider
                  onValueChange={(value: number[]) => setSelected(value)}
                  value={selected}
                  defaultValue={[0.5]}
                  className="w-[100px] mx-2 cursor-pointer"
                  min={0.3}
                  max={1}
                  step={0.1}
                />
                <span className="w-2 text-xs">{selected}</span>
              </div>
            </div>
            <Select onOpenChange={setOpen}>
              <SelectTrigger className="w-16 h-6 bg-white text-black px-1 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black overflow-ellipsis whitespace-nowrap">
                {["MSE", "PSNR", "LPIPS"].map((method, idx) => (
                  <SelectItem key={idx} value={method} className="text-xs">
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <img src="/instances.png" alt="instances img" />
      </div>
      <Separator
        orientation="vertical"
        className="h-[660px] w-[1px] mx-[2px]"
      />
      <div className="w-[545px] h-[660px] flex flex-col justify-between items-start">
        <div>
          <div className="flex items-center">
            <UserQuestion01Icon />
            <h5 className="text-[15px] ml-1">Membership Inference Attack</h5>
          </div>
          <img src="/logit.png" alt="logit img" />
        </div>
        <div className="w-full">
          <div className="flex items-center">
            <ImageDelete01Icon />
            <h5 className="text-[15px] ml-1">Reconstruction Attack</h5>
          </div>
          <div className="w-full flex justify-between items-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <NeuralNetworkIcon />
                <span className="ml-[3px] text-[15px]">
                  Baseline Model (id01)
                </span>
              </div>
              <img src="/dog2.png" alt="dog img" />
              <div className="font-extralight text-sm">
                <span className="mr-6">PSNR: 0</span>
                <span>LPIPS: 0.1234</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <GitCompareIcon />
                <span className="ml-[3px] text-[15px]">
                  Comparison Model (id02)
                </span>
              </div>
              <img src="/blurredDog.png" alt="blurred dog img" />
              <div className="font-extralight text-sm">
                <span className="mr-6">PSNR: 9.75</span>
                <span>LPIPS: 0.52</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
