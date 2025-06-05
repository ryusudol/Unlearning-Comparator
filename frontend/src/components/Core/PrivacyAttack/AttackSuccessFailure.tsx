import InstancePanel from "./InstancePanel";
import { Bin, Data, CategoryType, Image } from "../../../types/attack";

interface AttackSuccessFailureProps {
  mode: "A" | "B";
  thresholdValue: number;
  hoveredId: number | null;
  data: Data;
  imageMap: Map<number, Image>;
  attackScore: number;
  setHoveredId: (val: number | null) => void;
  onElementClick: (
    event: React.MouseEvent,
    elementData: Bin & { type: CategoryType }
  ) => void;
}

export default function AttackSuccessFailure({
  mode,
  thresholdValue,
  hoveredId,
  data,
  imageMap,
  attackScore,
  setHoveredId,
  onElementClick,
}: AttackSuccessFailureProps) {
  const forgettingQualityScore = 1 - attackScore;

  return (
    <div className="h-full flex flex-col items-center relative bottom-0.5 left-[3px]">
      <p className="text-xl text-center mb-1.5">
        Privacy Score ={" "}
        <span className="font-semibold">
          {forgettingQualityScore === 1 ? 1 : forgettingQualityScore.toFixed(3)}
        </span>
      </p>
      <div className="flex gap-10">
        <InstancePanel
          model={mode}
          mode="success"
          data={data}
          thresholdValue={thresholdValue}
          imageMap={imageMap}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onElementClick={onElementClick}
        />
        <InstancePanel
          model={mode}
          mode="failure"
          data={data}
          thresholdValue={thresholdValue}
          imageMap={imageMap}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onElementClick={onElementClick}
        />
      </div>
    </div>
  );
}
