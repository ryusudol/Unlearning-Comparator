import View from "../components/View";
import AttackPlot from "../components/PrivacyAttack/AttackPlot";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/UI/select";
// import { Separator } from "../components/UI/separator";

export default function PrivacyAttack({ height }: { height: number }) {
  return (
    <View
      height={height}
      className="w-full flex justify-evenly items-center rounded-[6px] px-1.5"
    >
      <AttackPlot mode="Baseline" />
      <AttackPlot mode="Comparison" />
      {/* <div className="flex flex-col">
        <div className="flex flex-col">
          <span className="text-[17px] font-semibold">Attack by</span>
          <Select
          defaultValue={weightNames ? weightNames[0] : initModel}
          onValueChange={handleInitialModelChange}
          >
            <SelectTrigger className="h-[25px] text-base">
              <SelectValue
              placeholder={weightNames ? weightNames[0] : initModel}
              />
            </SelectTrigger>
            <SelectContent>
              {weightNames.map((weightName, idx) => {
              return (
                <SelectItem key={idx} value={weightName}>
                  {weightName}
                </SelectItem>
              );
            })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <span className="text-[17px] font-semibold">Attack Strategy</span>
        </div>
        <div>
          <span className="text-[17px] font-semibold">GROUP UNAWARE</span>
        </div>
      </div>
      <Separator orientation="vertical" className="h-[612px] w-[1px] mx-1.5" /> */}
    </View>
  );
}
