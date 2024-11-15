import { useRef, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";

import Tooltip from "../components/Tooltip";
import { API_URL } from "../constants/common";
import { Mode, Prob, HovereInstance } from "../views/Embeddings";

interface TooltipConfig {
  containerRef: React.RefObject<HTMLDivElement>;
  tooltipXSize: number;
  tooltipYSize: number;
}

export const useTooltip = (
  mode: Mode,
  hoveredInstance: HovereInstance | null,
  config: TooltipConfig
) => {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
      }
    };
  }, []);

  const showTooltip = (
    event: MouseEvent,
    data: (number | Prob)[],
    content: JSX.Element
  ) => {
    if (!config.containerRef.current) return;

    if (tooltipRef.current) {
      rootRef.current?.unmount();
      tooltipRef.current.remove();
    }

    const containerRect = config.containerRef.current.getBoundingClientRect();
    let xPos = event.clientX - containerRect.left + 10;
    let yPos = event.clientY - containerRect.top + 10;

    if (xPos + config.tooltipXSize > containerRect.width) {
      xPos = event.clientX - containerRect.left - config.tooltipXSize - 10;
      if (xPos < 0) {
        xPos = 0;
      }
    }

    if (yPos + config.tooltipYSize > containerRect.height) {
      yPos = event.clientY - containerRect.top - config.tooltipYSize - 10;
      if (yPos < 0) {
        yPos = 0;
      }
    }

    const tooltipDiv = document.createElement("div");
    tooltipDiv.style.position = "absolute";
    tooltipDiv.style.left = `${xPos}px`;
    tooltipDiv.style.top = `${yPos}px`;
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.backgroundColor = "white";
    tooltipDiv.style.padding = "5px";
    tooltipDiv.style.border = "1px solid rgba(0, 0, 0, 0.25)";
    tooltipDiv.style.borderRadius = "4px";
    tooltipDiv.style.zIndex = "30";
    tooltipDiv.className = "shadow-xl";

    config.containerRef.current.appendChild(tooltipDiv);
    tooltipRef.current = tooltipDiv;

    rootRef.current = createRoot(tooltipDiv);
    rootRef.current.render(content);
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      rootRef.current?.unmount();
      tooltipRef.current.remove();
      tooltipRef.current = null;
      rootRef.current = null;
    }
  };

  const handleTooltip = async (event: MouseEvent, data: (number | Prob)[]) => {
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/image/cifar10/${data[4]}`, {
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      if (controller.signal.aborted) return;

      const prob = data[5] as Prob;
      const imageUrl = URL.createObjectURL(blob);

      const barChartData =
        mode === "Baseline"
          ? {
              baseline: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(prob[idx] || 0),
              })),
              comparison: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(hoveredInstance?.comparisonProb?.[idx] || 0),
              })),
            }
          : {
              baseline: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(hoveredInstance?.baselineProb?.[idx] || 0),
              })),
              comparison: Array.from({ length: 10 }, (_, idx) => ({
                class: idx,
                value: Number(prob[idx] || 0),
              })),
            };

      const tooltipContent = (
        <Tooltip
          width={config.tooltipXSize}
          height={config.tooltipYSize}
          imageUrl={imageUrl}
          data={data}
          barChartData={barChartData}
        />
      );

      showTooltip(event, data, tooltipContent);

      return () => {
        URL.revokeObjectURL(imageUrl);
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Failed to fetch tooltip data:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  return {
    handleTooltip,
    hideTooltip,
  };
};
