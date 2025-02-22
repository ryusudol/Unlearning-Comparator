import { useMemo } from "react";
import * as d3 from "d3";

import { ScrollArea } from "../UI/scroll-area";
import { UNLEARN, RETRAIN } from "../../views/PrivacyAttack";
import { COLORS } from "../../constants/colors";
import { Data } from "./AttackAnalytics";
import { Bin, CategoryType, Image } from "./AttackAnalytics";

const CONFIG = {
  RETRAIN: "retrain",
  UNLEARN: "unlearn",
  HIGH_OPACITY: 1,
  LOW_OPACITY: 0.3,
  CIRCLE_RADIUS: 3,
  CELL_SIZE: 3 * 2 + 1,
  MAX_COLUMNS: 20,
  STROKE_WIDTH: "1.5px",
  TOTAL_DATA_COUNT: 400,
  ENTROPY_THRESHOLD_STEP: 0.05,
  CONFIDENCE_THRESHOLD_STEP: 0.25,
} as const;

interface AttackSuccessFailureProps {
  mode: "Baseline" | "Comparison";
  thresholdValue: number;
  aboveThreshold: string;
  thresholdStrategy: string;
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
  aboveThreshold,
  thresholdStrategy,
  hoveredId,
  data,
  imageMap,
  attackScore,
  setHoveredId,
  onElementClick,
}: AttackSuccessFailureProps) {
  const isBaseline = mode === "Baseline";
  const isAboveThresholdUnlearn = aboveThreshold === UNLEARN;
  const forgettingQualityScore = 1 - attackScore;
  const isStrategyMaxSuccessRate = thresholdStrategy === "MAX SUCCESS RATE";

  const { successGroup, failureGroup, successPct, failurePct } = useMemo(() => {
    if (!data || (!data.retrainData.length && !data.unlearnData.length)) {
      return {
        successGroup: [],
        failureGroup: [],
        successPct: 0,
        failurePct: 0,
      };
    }

    const successRetrain = data.retrainData.filter((item) =>
      isAboveThresholdUnlearn
        ? item.value < thresholdValue
        : item.value > thresholdValue
    );
    const successUnlearn = data.unlearnData.filter((item) =>
      isAboveThresholdUnlearn
        ? item.value > thresholdValue
        : item.value < thresholdValue
    );
    const successGroup = [
      ...successRetrain.map((item) => ({
        type: RETRAIN,
        img_idx: item.img_idx,
      })),
      ...successUnlearn.map((item) => ({
        type: UNLEARN,
        img_idx: item.img_idx,
      })),
    ];

    const failureUnlearn = data.unlearnData.filter((item) =>
      isAboveThresholdUnlearn
        ? item.value <= thresholdValue
        : item.value >= thresholdValue
    );
    const failureRetrain = data.retrainData.filter((item) =>
      isAboveThresholdUnlearn
        ? item.value >= thresholdValue
        : item.value <= thresholdValue
    );
    const failureGroup = [
      ...failureUnlearn.map((item) => ({
        type: UNLEARN,
        img_idx: item.img_idx,
      })),
      ...failureRetrain.map((item) => ({
        type: RETRAIN,
        img_idx: item.img_idx,
      })),
    ];

    const successPct = parseFloat(
      ((successGroup.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(2)
    );
    const failurePct = parseFloat(
      ((failureGroup.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(2)
    );

    return {
      successGroup,
      failureGroup,
      successPct,
      failurePct,
    };
  }, [data, isAboveThresholdUnlearn, thresholdValue]);

  const successImages = useMemo(() => {
    return successGroup.map((groupItem, idx) => {
      const imgData = imageMap.get(groupItem.img_idx);
      if (!imgData) return null;
      const strokeColor =
        groupItem.type === CONFIG.UNLEARN
          ? isBaseline
            ? COLORS.EMERALD
            : COLORS.PURPLE
          : COLORS.DARK_GRAY;
      const defaultBorderOpacity =
        groupItem.type === CONFIG.RETRAIN
          ? CONFIG.LOW_OPACITY
          : CONFIG.HIGH_OPACITY;
      const imageOpacity =
        hoveredId !== null ? (groupItem.img_idx === hoveredId ? 1 : 0.3) : 1;
      const borderOpacity =
        hoveredId !== null
          ? groupItem.img_idx === hoveredId
            ? 1
            : 0.3
          : defaultBorderOpacity;
      const borderColor = d3.color(strokeColor);
      borderColor!.opacity = borderOpacity;
      return (
        <img
          key={`success-${idx}`}
          src={`data:image/png;base64,${imgData.base64}`}
          alt="img"
          onMouseEnter={() => setHoveredId(groupItem.img_idx)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={(event) => {
            const value =
              data!.retrainData.find((d) => d.img_idx === groupItem.img_idx)
                ?.value ||
              data!.unlearnData.find((d) => d.img_idx === groupItem.img_idx)
                ?.value ||
              0;
            onElementClick(event, {
              img_idx: groupItem.img_idx,
              value,
              type: groupItem.type as CategoryType,
            });
          }}
          className="w-3 h-3 cursor-pointer"
          style={{
            border: `${CONFIG.STROKE_WIDTH} solid ${borderColor?.toString()}`,
            opacity: imageOpacity,
          }}
        />
      );
    });
  }, [
    data,
    hoveredId,
    imageMap,
    isBaseline,
    onElementClick,
    setHoveredId,
    successGroup,
  ]);

  const failureImages = useMemo(() => {
    return failureGroup.map((groupItem, idx) => {
      const imgData = imageMap.get(groupItem.img_idx);
      if (!imgData) return null;
      const strokeColor =
        groupItem.type === CONFIG.UNLEARN
          ? isBaseline
            ? COLORS.EMERALD
            : COLORS.PURPLE
          : COLORS.DARK_GRAY;
      const defaultBorderOpacity =
        groupItem.type === CONFIG.UNLEARN
          ? CONFIG.LOW_OPACITY
          : CONFIG.HIGH_OPACITY;
      const imageOpacity =
        hoveredId !== null ? (groupItem.img_idx === hoveredId ? 1 : 0.3) : 1;
      const borderOpacity =
        hoveredId !== null
          ? groupItem.img_idx === hoveredId
            ? 1
            : 0.3
          : defaultBorderOpacity;
      const borderColor = d3.color(strokeColor);
      borderColor!.opacity = borderOpacity;
      return (
        <img
          key={`success-${idx}`}
          src={`data:image/png;base64,${imgData.base64}`}
          alt="img"
          onMouseEnter={() => setHoveredId(groupItem.img_idx)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={(event) => {
            const value =
              data!.retrainData.find((d) => d.img_idx === groupItem.img_idx)
                ?.value ||
              data!.unlearnData.find((d) => d.img_idx === groupItem.img_idx)
                ?.value ||
              0;
            onElementClick(event, {
              img_idx: groupItem.img_idx,
              value,
              type: groupItem.type as CategoryType,
            });
          }}
          className="w-3 h-3 cursor-pointer"
          style={{
            border: `${CONFIG.STROKE_WIDTH} solid ${borderColor?.toString()}`,
            opacity: imageOpacity,
          }}
        />
      );
    });
  }, [
    data,
    failureGroup,
    hoveredId,
    imageMap,
    isBaseline,
    onElementClick,
    setHoveredId,
  ]);

  return (
    <div className="relative h-full flex flex-col items-center mt-1">
      <div className="flex gap-[38px]">
        <div>
          <div className="flex items-center">
            <span
              className={`text-[15px] font-medium ${
                isStrategyMaxSuccessRate && "text-red-500"
              }`}
            >
              Attack Success
            </span>
            <span
              className={`ml-1.5 text-[15px] font-light w-11 ${
                isStrategyMaxSuccessRate && "text-red-500"
              }`}
            >
              {successPct.toFixed(2)}%
            </span>
          </div>
          <ScrollArea style={{ height: "188px" }}>
            <div className="grid grid-cols-[repeat(20,12px)] gap-[1px]">
              {successImages}
            </div>
          </ScrollArea>
        </div>
        <div>
          <div className="flex items-center">
            <span className="text-[15px] font-medium mb-0.5">
              Attack Failure
            </span>
            <span className="ml-4 text-[15px] font-light w-11">
              {failurePct.toFixed(2)}%
            </span>
          </div>
          <ScrollArea style={{ height: "188px" }}>
            <div className="grid grid-cols-[repeat(20,12px)] gap-[1px]">
              {failureImages}
            </div>
          </ScrollArea>
        </div>
      </div>
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[17px] font-medium text-center">
        Forgetting Quality Score:{" "}
        {forgettingQualityScore === 1 ? 1 : forgettingQualityScore.toFixed(3)}
      </p>
    </div>
  );
}
