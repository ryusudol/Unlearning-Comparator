import React, { useState, useMemo } from "react";
import * as d3 from "d3";

import SubsetImageSkeleton from "./SubsetImageSkeleton";
import { Slider } from "../../UI/slider";
import { Checkbox } from "../../UI/checkbox";
import { ScrollArea } from "../../UI/scroll-area";
import { useAttackStateStore } from "../../../stores/attackStore";
import { THRESHOLD_STRATEGIES } from "../../../constants/privacyAttack";
import { UNLEARN, RETRAIN } from "../../../constants/common";
import { COLORS } from "../../../constants/colors";
import { Data, Image, Bin, CategoryType } from "../../../types/attack";
import { cn } from "../../../utils/util";

const CONFIG = {
  IMG_COLLECTIONS_WIDTH: 262,
  HIGH_OPACITY: 1,
  LOW_OPACITY: 0.3,
  TOTAL_DATA_COUNT: 400,
  IMG_SIZES: [12, 16, 20, 24, 28, 42],
} as const;

interface Props {
  model: "A" | "B";
  mode: "success" | "failure";
  data: Data;
  thresholdValue: number;
  imageMap: Map<number, Image>;
  hoveredId: number | null;
  isFetchingSubsetImages: boolean;
  setHoveredId: (val: number | null) => void;
  onElementClick: (
    event: React.MouseEvent,
    elementData: Bin & { type: CategoryType }
  ) => void;
}

export default function InstancePanel({
  model,
  mode,
  data,
  thresholdValue,
  imageMap,
  hoveredId,
  isFetchingSubsetImages,
  setHoveredId,
  onElementClick,
}: Props) {
  const strategy = useAttackStateStore((state) => state.strategy);

  const [imgSize, setImgSize] = useState(0);
  const [isGrayChecked, setIsGrayChecked] = useState(true);
  const [isColorChecked, setIsColorChecked] = useState(true);

  const computedThresholdData = data?.lineChartData.find(
    (d) => Math.abs(d.threshold - thresholdValue) < 0.001
  );

  const isModelA = model === "A";
  const isModeSuccess = mode === "success";
  const isAboveThresholdUnlearn = computedThresholdData?.type === UNLEARN;
  const isStrategyMaxSuccessRate =
    strategy === THRESHOLD_STRATEGIES[2].strategy;
  const color = isModeSuccess
    ? isModelA
      ? COLORS.EMERALD
      : COLORS.PURPLE
    : isModelA
    ? COLORS.LIGHT_EMERALD
    : COLORS.LIGHT_PURPLE;
  const circleStrokeColor = isModeSuccess
    ? isModelA
      ? "#0D815B"
      : "#763CAD"
    : isModelA
    ? "#9ACCB5"
    : "#C6A7E6";

  const { imageGroup, pct } = useMemo(() => {
    if (!data || (!data.retrainData.length && !data.unlearnData.length)) {
      return {
        imageGroup: [],
        pct: 0,
      };
    }

    const predictedRetrained = isModeSuccess
      ? data.retrainData.filter((item) =>
          isAboveThresholdUnlearn
            ? item.value < thresholdValue
            : item.value > thresholdValue
        )
      : data.retrainData.filter((item) =>
          isAboveThresholdUnlearn
            ? item.value >= thresholdValue
            : item.value <= thresholdValue
        );
    const predictedUnlearned = isModeSuccess
      ? data.unlearnData.filter((item) =>
          isAboveThresholdUnlearn
            ? item.value > thresholdValue
            : item.value < thresholdValue
        )
      : data.unlearnData.filter((item) =>
          isAboveThresholdUnlearn
            ? item.value <= thresholdValue
            : item.value >= thresholdValue
        );

    const imageGroup = [
      ...predictedRetrained.map((item) => ({
        type: RETRAIN,
        img_idx: item.img_idx,
      })),
      ...predictedUnlearned.map((item) => ({
        type: UNLEARN,
        img_idx: item.img_idx,
      })),
    ];

    const pct = parseFloat(
      ((imageGroup.length / CONFIG.TOTAL_DATA_COUNT) * 100).toFixed(2)
    );

    return {
      imageGroup,
      pct,
    };
  }, [data, isAboveThresholdUnlearn, isModeSuccess, thresholdValue]);

  const getStrokeWidth = (imgSize: number) => {
    const size = CONFIG.IMG_SIZES[imgSize];
    if (size <= CONFIG.IMG_SIZES[1]) return "1px";
    if (size === CONFIG.IMG_SIZES[2]) return "1.5px";
    return "2px";
  };

  const images = useMemo(() => {
    type FilteredImageGroup = {
      type: string;
      img_idx: number;
    };
    let filteredSuccessGroup: FilteredImageGroup[] = [];
    if (isGrayChecked && isColorChecked) {
      filteredSuccessGroup = imageGroup;
    } else if (isGrayChecked) {
      filteredSuccessGroup = imageGroup.filter((item) => item.type === RETRAIN);
    } else if (isColorChecked) {
      filteredSuccessGroup = imageGroup.filter((item) => item.type === UNLEARN);
    }

    return filteredSuccessGroup.map((groupItem, idx) => {
      const imgData = imageMap.get(groupItem.img_idx);

      if (!imgData) return null;

      const isItemRetrained = groupItem.type === RETRAIN;
      const strokeColor = isItemRetrained
        ? COLORS.DARK_GRAY
        : isModelA
        ? COLORS.EMERALD
        : COLORS.PURPLE;
      const defaultBorderOpacity = isItemRetrained
        ? CONFIG.LOW_OPACITY
        : CONFIG.HIGH_OPACITY;
      const imageOpacity =
        hoveredId !== null
          ? groupItem.img_idx === hoveredId
            ? CONFIG.HIGH_OPACITY
            : CONFIG.LOW_OPACITY
          : CONFIG.HIGH_OPACITY;
      const borderOpacity =
        hoveredId !== null
          ? groupItem.img_idx === hoveredId
            ? CONFIG.HIGH_OPACITY
            : CONFIG.LOW_OPACITY
          : defaultBorderOpacity;
      const borderColor = d3.color(strokeColor);
      borderColor!.opacity = borderOpacity;

      return (
        <img
          key={`${mode}-${idx}`}
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
            border: `${getStrokeWidth(imgSize)} solid ${
              isItemRetrained
                ? isModeSuccess
                  ? COLORS.LIGHT_GRAY
                  : COLORS.DARK_GRAY
                : color
            }`,
            opacity: imageOpacity,
            width: `${CONFIG.IMG_SIZES[imgSize]}px`,
            height: `${CONFIG.IMG_SIZES[imgSize]}px`,
          }}
        />
      );
    });
  }, [
    color,
    data,
    hoveredId,
    imageGroup,
    imageMap,
    imgSize,
    isColorChecked,
    isGrayChecked,
    isModeSuccess,
    isModelA,
    mode,
    onElementClick,
    setHoveredId,
  ]);

  const getGridColumns = (imgSize: number) => {
    const size = CONFIG.IMG_SIZES[imgSize];
    const columns = Math.floor((CONFIG.IMG_COLLECTIONS_WIDTH + 1) / (size + 1));
    return columns;
  };

  const handleImgSizeControl = (value: number[]) => {
    setImgSize(value[0]);
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span
            className={cn(
              isModeSuccess && isStrategyMaxSuccessRate && "text-red-500"
            )}
          >
            {mode[0].toUpperCase() + mode.slice(1)}
          </span>
          <span
            className={cn(
              "mx-1 text-sm font-light w-11",
              isModeSuccess && isStrategyMaxSuccessRate && "text-red-500"
            )}
          >
            {pct.toFixed(2)}%
          </span>
          <div className="flex items-center gap-1">
            <Checkbox
              id={`${mode}-gray`}
              checked={isGrayChecked}
              onCheckedChange={(checked: boolean) => setIsGrayChecked(checked)}
              className={cn(
                "w-3.5 h-3.5 border",
                isModeSuccess && "data-[state=checked]:text-black"
              )}
              style={{
                backgroundColor: isModeSuccess
                  ? COLORS.LIGHT_GRAY
                  : COLORS.DARK_GRAY,
                borderColor: isModeSuccess ? "#ADADAD" : "#4A4A4A",
              }}
            />
            <Checkbox
              id={`${mode}-color`}
              checked={isColorChecked}
              onCheckedChange={(checked: boolean) => setIsColorChecked(checked)}
              className={cn(
                "w-3.5 h-3.5 border",
                !isModeSuccess && "data-[state=checked]:text-black"
              )}
              style={{
                backgroundColor: color,
                borderColor: circleStrokeColor,
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs">Size</span>
          <Slider
            className="w-16 h-1"
            defaultValue={[0]}
            min={0}
            max={CONFIG.IMG_SIZES.length - 1}
            step={1}
            onValueChange={handleImgSizeControl}
          />
          <span className="text-xs">{CONFIG.IMG_SIZES[imgSize]}px</span>
        </div>
      </div>
      <ScrollArea
        style={{ width: CONFIG.IMG_COLLECTIONS_WIDTH }}
        className="h-[168px]"
      >
        {isFetchingSubsetImages ? (
          <SubsetImageSkeleton />
        ) : (
          <div
            className="grid gap-[1px]"
            style={{
              gridTemplateColumns: `repeat(${getGridColumns(imgSize)}, ${
                CONFIG.IMG_SIZES[imgSize]
              }px)`,
            }}
          >
            {images}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
