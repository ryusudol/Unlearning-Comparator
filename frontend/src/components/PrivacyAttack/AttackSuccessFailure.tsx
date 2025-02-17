import { useRef, useMemo, useEffect, useState } from "react";
import * as d3 from "d3";

import { useForgetClass } from "../../hooks/useForgetClass";
import { UNLEARN, Metric } from "../../views/PrivacyAttack";
import { COLORS } from "../../constants/colors";
import { Data } from "./AttackAnalytics";
import { fetchAllSubsetImages } from "../../utils/api/privacyAttack";
import { Image } from "../../types/privacy-attack";

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
  metric: Metric;
  thresholdValue: number;
  aboveThreshold: string;
  thresholdStrategy: string;
  data: Data;
  attackScore: number;
}

export default function AttackSuccessFailure({
  mode,
  metric,
  thresholdValue,
  aboveThreshold,
  thresholdStrategy,
  data,
  attackScore,
}: AttackSuccessFailureProps) {
  const { forgetClassNumber } = useForgetClass();

  const [images, setImages] = useState<Image[]>();

  const successContainerRef = useRef<HTMLDivElement>(null);
  const failureContainerRef = useRef<HTMLDivElement>(null);

  const isBaseline = mode === "Baseline";
  const isAboveThresholdUnlearn = aboveThreshold === UNLEARN;
  const forgettingQualityScore = 1 - attackScore;

  useEffect(() => {
    const init = async () => {
      try {
        const res: { images: Image[] } = await fetchAllSubsetImages(
          forgetClassNumber
        );
        setImages(res.images);
      } catch (e) {
        if (e instanceof Error) {
          console.error(`Error fetching subset images: ${e.message}`);
        } else {
          console.error("Error fetching subset images: Unknown error");
        }
      }
    };
    init();
  }, [forgetClassNumber]);

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
        type: CONFIG.RETRAIN,
        img_idx: item.img_idx,
      })),
      ...successUnlearn.map((item) => ({
        type: CONFIG.UNLEARN,
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
        type: CONFIG.UNLEARN,
        img_idx: item.img_idx,
      })),
      ...failureRetrain.map((item) => ({
        type: CONFIG.RETRAIN,
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

  useEffect(() => {
    if (!images) return;

    const imageMap = new Map<number, Image>();
    images.forEach((img) => imageMap.set(img.index, img));

    // render attack success images
    if (successContainerRef.current) {
      const container = d3
        .select(successContainerRef.current)
        .style("display", "grid")
        .style("grid-template-columns", `repeat(${CONFIG.MAX_COLUMNS}, 12px)`)
        .style("gap", "1px");
      container.selectAll("*").remove();

      successGroup.forEach((groupItem) => {
        const imgData = imageMap.get(groupItem.img_idx);

        if (!imgData) return;

        const strokeColor =
          groupItem.type === CONFIG.UNLEARN
            ? isBaseline
              ? COLORS.PURPLE
              : COLORS.EMERALD
            : COLORS.DARK_GRAY;
        const colorWithOpacity = d3.color(strokeColor);
        if (groupItem.type === CONFIG.RETRAIN) {
          colorWithOpacity!.opacity = CONFIG.LOW_OPACITY;
        }

        container
          .append("img")
          .attr("src", `data:image/png;base64,${imgData.base64}`)
          .style("width", "12px")
          .style("height", "12px")
          .style("display", "inline-block")
          .style("border", `${CONFIG.STROKE_WIDTH} solid ${colorWithOpacity}`);
      });
    }

    // render attack failure images
    if (failureContainerRef.current) {
      const container = d3
        .select(failureContainerRef.current)
        .style("display", "grid")
        .style("grid-template-columns", `repeat(${CONFIG.MAX_COLUMNS}, 12px)`)
        .style("gap", "1px");
      container.selectAll("*").remove();

      failureGroup.forEach((groupItem) => {
        const imgData = imageMap.get(groupItem.img_idx);

        if (!imgData) return;

        const strokeColor =
          groupItem.type === CONFIG.UNLEARN
            ? isBaseline
              ? COLORS.PURPLE
              : COLORS.EMERALD
            : COLORS.DARK_GRAY;
        const colorWithOpacity = d3.color(strokeColor);
        if (groupItem.type === CONFIG.UNLEARN) {
          colorWithOpacity!.opacity = CONFIG.LOW_OPACITY;
        }

        container
          .append("img")
          .attr("src", `data:image/png;base64,${imgData.base64}`)
          .style("width", "12px")
          .style("height", "12px")
          .style("display", "inline-block")
          .style("border", `${CONFIG.STROKE_WIDTH} solid ${colorWithOpacity}`);
      });
    }
  }, [failureGroup, images, isBaseline, successGroup]);

  return (
    <div className="relative h-full flex flex-col items-center mt-1">
      <div className="flex gap-[38px]">
        <div>
          <div className="flex items-center">
            <span
              className={`text-[15px] font-medium ${
                thresholdStrategy === "MAX SUCCESS RATE" && "text-red-500"
              }`}
            >
              Attack Success
            </span>
            <span className="ml-1.5 text-[15px] font-light w-11">
              {successPct.toFixed(2)}%
            </span>
          </div>
          <div ref={successContainerRef} style={{ textAlign: "left" }}></div>
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
          <div ref={failureContainerRef} style={{ textAlign: "left" }}></div>
        </div>
      </div>
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[17px] font-medium text-center">
        Forgetting Quality Score:{" "}
        {forgettingQualityScore === 1 ? 1 : forgettingQualityScore.toFixed(3)}
      </p>
    </div>
  );
}
