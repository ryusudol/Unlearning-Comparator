import { useContext } from "react";

import { Label } from "../components/UI/label";
import { RadioGroup, RadioGroupItem } from "../components/UI/radio-group";
import { Layers02Icon } from "../components/UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";

export default function Correlations({ height }: { height: number }) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { selectedForgetClasses } = useContext(ForgetClassContext);

  const allSelected = baseline !== "" && comparison !== "";

  return (
    <section
      style={{ height: `${height}px` }}
      className="w-[490px] px-[5px] mt-[289px] py-0.5 flex flex-col border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)] relative"
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          <Layers02Icon />
          <h5 className="font-semibold ml-[3px] text-lg">
            Layer-Wise Correlations
          </h5>
        </div>
        {allSelected && (
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
        )}
      </div>
      {selectedForgetClasses ? (
        allSelected ? (
          <div className="flex items-center">
            <div className="flex -rotate-90 w-8 mr-[2px] relative">
              <div className="flex flex-col items-center leading-4 relative right-[132px]">
                <span className="text-[15px] font-light whitespace-nowrap">
                  Remaining Data
                </span>
                <span className="text-[11px] font-extralight whitespace-nowrap">
                  Layer After Unlearning
                </span>
              </div>
              <div className="flex flex-col items-center leading-4 relative right-[18px]">
                <span className="text-[15px] font-light whitespace-nowrap">
                  Forgetting Data
                </span>
                <span className="text-[11px] font-extralight whitespace-nowrap">
                  Layer After Unlearning
                </span>
              </div>
            </div>
            {/* Heatmap 1 */}
            <div className="flex flex-col items-center -mt-1.5 mr-1">
              <span className="text-[17px]">Baseline Model ({baseline})</span>
              <img src="/heatmap1.png" alt="heatmap img 1" />
              <img src="/heatmap3.png" alt="heatmap img 3" />
              <span className="text-[11px] font-extralight -mt-[5px]">
                Layer Before Unlearning
              </span>
            </div>
            {/* Heatmap 2 */}
            <div className="flex flex-col items-center -mt-1.5">
              <span className="text-[17px]">
                Comparison Model ({comparison})
              </span>
              <img src="/heatmap2.png" alt="heatmap img 2" />
              <img src="/heatmap4.png" alt="heatmap img 4" />
              <span className="text-[11px] font-extralight -mt-[5px]">
                Layer Before Unlearning
              </span>
            </div>
            {/* Legend */}
            <div className="flex flex-col items-center">
              <img
                src="/heatmap-legend.png"
                alt="heatmap legend img"
                className="ml-1"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
            Select both Baseline and Comparison.
          </div>
        )
      ) : (
        <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
          Select the target forget class first.
        </div>
      )}
    </section>
  );
}
