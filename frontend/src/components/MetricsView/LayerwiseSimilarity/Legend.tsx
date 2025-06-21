import { cn } from "../../../utils/util";
import { CircleIcon, FatMultiplicationSignIcon } from "../../common/icons";
import { LINE_CHART_LEGEND_DATA } from "../../../constants/layerWiseSimilarity";
import { CONFIG } from "./LineChart";
import {
  useModelAExperiment,
  useModelBExperiment,
} from "../../../hooks/useModelExperiment";

export default function CustomLegend() {
  const modelAExperiment = useModelAExperiment();
  const modelBExperiment = useModelBExperiment();

  const CIRCLE = "circle";

  return (
    <div className="absolute bottom-[68px] left-[45px] text-xs leading-4 z-10 border-[2px] border-[#EFEFEF] rounded-[4px] pl-2.5 pr-1.5 py-0.5 bg-white/60">
      {LINE_CHART_LEGEND_DATA.map((item, i) => {
        const Icon =
          item.type === CIRCLE ? CircleIcon : FatMultiplicationSignIcon;
        const experiment = i % 2 === 0 ? modelAExperiment : modelBExperiment;

        return (
          <div key={i} className={cn("flex items-center", item.spacing)}>
            <div className="relative">
              <Icon
                className={cn("z-10", {
                  "mr-2": item.type === CIRCLE,
                  "mr-0.5": item.type !== CIRCLE,
                })}
                style={{
                  color: item.color,
                  width:
                    item.type === CIRCLE ? CONFIG.DOT_SIZE : CONFIG.CROSS_SIZE,
                }}
              />
              <div
                className="absolute top-1/2 w-[18px] h-[1px]"
                style={{
                  transform: `translate(${i > 1 ? "-3.8px" : "-4px"}, -50%)`,
                  ...(i > 1
                    ? { borderTop: `2px dashed ${item.color}` }
                    : { backgroundColor: item.color }),
                }}
              />
            </div>
            <span className={cn({ "ml-1.5": i > 1 })}>
              <span style={{ color: item.color }}>
                {item.label} ({experiment.Type}, {experiment.ID}){" "}
              </span>
              <span>{i < 2 ? "Retain" : "Forget"}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
