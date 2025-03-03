import { useState, useMemo } from "react";
import * as d3 from "d3";

import { Slider } from "../UI/slider";
import { ScrollArea } from "../UI/scroll-area";
import { UNLEARN, RETRAIN } from "../../views/PrivacyAttack";
import { COLORS } from "../../constants/colors";
import { Bin, Data, CategoryType, Image } from "../../types/attack";
import { THRESHOLD_STRATEGIES } from "../../constants/privacyAttack";

const CONFIG = {
  RETRAIN: "retrain",
  UNLEARN: "unlearn",
  HIGH_OPACITY: 1,
  LOW_OPACITY: 0.3,
  TOTAL_DATA_COUNT: 400,
  IMG_SIZES: [12, 16, 20, 24, 28],
} as const;

interface AttackSuccessFailureProps {
  mode: "A" | "B";
  thresholdValue: number;
  direction: string;
  strategy: string;
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
  direction,
  strategy,
  hoveredId,
  data,
  imageMap,
  attackScore,
  setHoveredId,
  onElementClick,
}: AttackSuccessFailureProps) {
  const [successImgSize, setSuccessImgSize] = useState(0);
  const [failureImgSize, setFailureImgSize] = useState(0);

  const isModelA = mode === "A";
  const isAboveThresholdUnlearn = direction === UNLEARN;
  const forgettingQualityScore = 1 - attackScore;
  const isStrategyMaxSuccessRate =
    strategy === THRESHOLD_STRATEGIES[2].strategy;

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

  const getGridColumns = (imgSize: number) => {
    const size = CONFIG.IMG_SIZES[imgSize];
    const columns = Math.floor(261 / (size + 1));
    return columns;
  };

  const getStrokeWidth = (imgSize: number) => {
    const size = CONFIG.IMG_SIZES[imgSize];
    if (size <= CONFIG.IMG_SIZES[1]) return "1px";
    if (size === CONFIG.IMG_SIZES[2]) return "1.5px";
    return "2px";
  };

  const successImages = useMemo(() => {
    return successGroup.map((groupItem, idx) => {
      const imgData = imageMap.get(groupItem.img_idx);
      if (!imgData) return null;
      const strokeColor =
        groupItem.type === CONFIG.UNLEARN
          ? isModelA
            ? COLORS.EMERALD
            : COLORS.PURPLE
          : COLORS.DARK_GRAY;
      const imageOpacity =
        hoveredId !== null
          ? groupItem.img_idx === hoveredId
            ? CONFIG.HIGH_OPACITY
            : CONFIG.LOW_OPACITY
          : CONFIG.HIGH_OPACITY;
      const borderColor = d3.color(strokeColor);
      borderColor!.opacity = 1;
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
          className="cursor-pointer"
          style={{
            border: `${getStrokeWidth(
              successImgSize
            )} solid ${borderColor?.toString()}`,
            opacity: imageOpacity,
            width: `${CONFIG.IMG_SIZES[successImgSize]}px`,
            height: `${CONFIG.IMG_SIZES[successImgSize]}px`,
          }}
        />
      );
    });
  }, [
    data,
    hoveredId,
    imageMap,
    isModelA,
    onElementClick,
    setHoveredId,
    successGroup,
    successImgSize,
  ]);

  const failureImages = useMemo(() => {
    return failureGroup.map((groupItem, idx) => {
      const imgData = imageMap.get(groupItem.img_idx);
      if (!imgData) return null;
      const strokeColor =
        groupItem.type === CONFIG.UNLEARN
          ? isModelA
            ? COLORS.EMERALD
            : COLORS.PURPLE
          : COLORS.DARK_GRAY;
      const imageOpacity =
        hoveredId !== null
          ? groupItem.img_idx === hoveredId
            ? CONFIG.HIGH_OPACITY
            : CONFIG.LOW_OPACITY
          : CONFIG.HIGH_OPACITY;
      const borderColor = d3.color(strokeColor);
      borderColor!.opacity = 1;
      return (
        <img
          key={`failure-${idx}`}
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
          className="cursor-pointer"
          style={{
            border: `${getStrokeWidth(
              failureImgSize
            )} solid ${borderColor?.toString()}`,
            opacity: imageOpacity,
            width: `${CONFIG.IMG_SIZES[failureImgSize]}px`,
            height: `${CONFIG.IMG_SIZES[failureImgSize]}px`,
          }}
        />
      );
    });
  }, [
    data,
    failureGroup,
    failureImgSize,
    hoveredId,
    imageMap,
    isModelA,
    onElementClick,
    setHoveredId,
  ]);

  const handleImgSizeControl = (value: number[], id: string) => {
    if (id === "success") {
      setSuccessImgSize(value[0]);
    } else if (id === "failure") {
      setFailureImgSize(value[0]);
    }
  };

  return (
    <div className="relative h-full flex flex-col items-center">
      <p className="text-xl text-center mt-2.5 mb-1.5">
        Forgetting Quality Score ={" "}
        <span className="font-semibold">
          {forgettingQualityScore === 1 ? 1 : forgettingQualityScore.toFixed(3)}
        </span>
      </p>
      <div className="flex gap-10">
        <div>
          <div className="flex justify-between items-center">
            <div>
              <span className={isStrategyMaxSuccessRate ? "text-red-500" : ""}>
                Success
              </span>
              <span
                className={`ml-2 text-[15px] font-light w-11 ${
                  isStrategyMaxSuccessRate && "text-red-500"
                }`}
              >
                {successPct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Size</span>
              <Slider
                id="success"
                className="w-20 h-1"
                defaultValue={[0]}
                min={0}
                max={4}
                step={1}
                onValueChange={(value) =>
                  handleImgSizeControl(value, "success")
                }
              />
              <span className="text-xs">
                {CONFIG.IMG_SIZES[successImgSize]}px
              </span>
            </div>
          </div>
          <ScrollArea className="w-[260px] h-[150px]">
            <div
              className="grid gap-[1px]"
              style={{
                gridTemplateColumns: `repeat(${getGridColumns(
                  successImgSize
                )}, ${CONFIG.IMG_SIZES[successImgSize]}px)`,
              }}
            >
              {successImages}
            </div>
          </ScrollArea>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <div>
              <span>Failure</span>
              <span className="ml-2 text-[15px] font-light w-11">
                {failurePct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Size</span>
              <Slider
                id="failure"
                className="w-20 h-1"
                defaultValue={[0]}
                min={0}
                max={4}
                step={1}
                onValueChange={(value) =>
                  handleImgSizeControl(value, "failure")
                }
              />
              <span className="text-xs">
                {CONFIG.IMG_SIZES[failureImgSize]}px
              </span>
            </div>
          </div>
          <ScrollArea className="w-[260px] h-[150px]">
            <div
              className="grid gap-[1px]"
              style={{
                gridTemplateColumns: `repeat(${getGridColumns(
                  failureImgSize
                )}, ${CONFIG.IMG_SIZES[failureImgSize]}px)`,
              }}
            >
              {failureImages}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
