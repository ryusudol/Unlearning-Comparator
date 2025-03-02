import Button from "../CustomButton";
import { Separator } from "../UI/separator";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { CIFAR_10_CLASSES } from "../../constants/common";
import { TABLEAU10 } from "../../constants/colors";
import { CircleIcon, FatMultiplicationSignIcon } from "../UI/icons";
import { VIEW_MODES } from "../../constants/embeddings";

interface Props {
  viewMode: string;
  setViewMode: (mode: string) => void;
}

export default function EmbeddingsLegend({ viewMode, setViewMode }: Props) {
  const forgetClass = useForgetClassStore((state) => state.forgetClass);

  const oddIndices = CIFAR_10_CLASSES.filter((_, idx) => idx % 2 === 0);
  const evenIndices = CIFAR_10_CLASSES.filter((_, idx) => idx % 2 !== 0);

  const handleHighlightBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const mode = e.currentTarget.innerHTML;
    if (mode !== viewMode) {
      setViewMode(mode);
    } else {
      setViewMode("All");
    }
  };

  return (
    <div className="w-full h-[94px] flex px-3.5 text-sm z-10 relative top-3">
      <div className="flex flex-col mr-[22px]">
        <p className="text-lg font-medium mb-1">True Class</p>
        <ul className="flex flex-col gap-1">
          <li className="flex items-center text-nowrap">
            <CircleIcon className="w-2 h-2 mr-1.5 relative left-[1px]" />
            <span>Retain Class</span>
          </li>
          <li className="flex items-center">
            <FatMultiplicationSignIcon className="w-2.5 h-2.5 mr-1" />
            <span>Forget Class</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-col mr-3.5">
        <p className="text-lg font-medium mb-1">Predicted Class</p>
        <div
          style={{ gridTemplateColumns: "100px 70px 70px 70px 75px" }}
          className="grid gap-y-1"
        >
          {oddIndices.map((name, idx) => {
            const originalIdx = idx * 2;
            return (
              <li key={originalIdx} className="flex items-center">
                <div
                  style={{ backgroundColor: TABLEAU10[originalIdx] }}
                  className="w-3 h-4 mr-[5px]"
                />
                <span>
                  {forgetClass === originalIdx ? name + " (X)" : name}
                </span>
              </li>
            );
          })}
          {evenIndices.map((name, idx) => {
            const originalIdx = idx * 2 + 1;
            return (
              <li key={originalIdx} className="flex items-center">
                <div
                  style={{ backgroundColor: TABLEAU10[originalIdx] }}
                  className="w-3 h-4 mr-[5px]"
                />
                <span>
                  {forgetClass === originalIdx ? name + " (X)" : name}
                </span>
              </li>
            );
          })}
        </div>
      </div>
      <div className="flex gap-[15px]">
        <div className="ml-2">
          <p className="text-lg font-medium mb-[5px]">Highlight</p>
          <p className="w-[100px] text-[13px] font-light">
            Choose a category to emphasize:
          </p>
        </div>
        <div className="flex gap-[15px]">
          {VIEW_MODES.map((mode, idx) => (
            <div key={idx}>
              <Button
                onClick={handleHighlightBtnClick}
                className={`mb-1 ${
                  viewMode === mode.label
                    ? "bg-gray-100 hover:bg-gray-100 text-red-500"
                    : ""
                }`}
                style={{ width: mode.length }}
              >
                {mode.label}
              </Button>
              <p
                style={{ width: mode.length }}
                className="text-[13px] font-light"
              >
                {mode.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Separator
        orientation="horizontal"
        className="w-[calc(100%+12.8px)] h-[1px] absolute bottom-0 -right-1.5"
      />
    </div>
  );
}
