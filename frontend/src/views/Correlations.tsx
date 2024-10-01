import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Layers02Icon, ZoomInAreaIcon } from "../components/ui/icons";

interface Props {
  height: number;
}

export default function Correlations({ height }: Props) {
  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[480px] p-[5px] flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="flex items-center">
            <Layers02Icon />
            <h5 className="font-semibold ml-[3px] mr-5">
              Layer-Wise CKA Correlations
            </h5>
          </div>
          <ZoomInAreaIcon className="cursor-pointer" />
        </div>
        <div className="flex items-center">
          <span className="text-xs font-light mr-2">Dataset:</span>
          <RadioGroup className="flex" defaultValue="training">
            <div className="flex items-center space-x-[2px]">
              <RadioGroupItem value="training" id="training" />
              <Label className="text-xs font-light" htmlFor="training">
                Training
              </Label>
            </div>
            <div className="flex items-center space-x-[2px]">
              <RadioGroupItem value="test" id="test" />
              <Label className="text-xs font-light" htmlFor="test">
                Test
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </section>
  );
}
