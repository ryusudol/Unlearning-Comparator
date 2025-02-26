import { Separator } from "../UI/separator";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { CIFAR_10_CLASSES } from "../../constants/common";
import { TABLEAU10 } from "../../constants/colors";
import { CircleIcon, FatMultiplicationSignIcon } from "../UI/icons";

export default function EmbeddingsLegend() {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);

  return (
    <div className="h-9 flex items-center bg-white border border-b-white rounded-t-[6px] px-2 py-1 absolute -top-9 -right-[1px] text-sm z-10">
      <div className="flex items-center mr-4">
        <span className="font-medium mr-2.5">True Class</span>
        <ul className="flex items-center gap-[9.2px]">
          <li className="flex items-center">
            <CircleIcon className="w-[9px] h-[9px] mr-[3px]" />
            <span>Retain</span>
          </li>
          <li className="flex items-center">
            <FatMultiplicationSignIcon className="mr-[3px]" />
            <span>Forget</span>
          </li>
        </ul>
      </div>
      <div className="flex items-center">
        <span className="font-medium mr-2.5">Predicted Class</span>
        <ul className="flex items-center gap-2">
          {CIFAR_10_CLASSES.map((name, idx) => (
            <li key={idx} className="flex items-center">
              <div
                style={{ backgroundColor: TABLEAU10[idx] }}
                className="w-3.5 h-3.5 mr-[3px]"
              />
              <span>{forgetClass === idx ? name + " (X)" : name}</span>
            </li>
          ))}
        </ul>
      </div>
      <Separator
        orientation="horizontal"
        className="absolute bottom-[1px] h-[1px] w-[calc(100%-16px)]"
      />
    </div>
  );
}
