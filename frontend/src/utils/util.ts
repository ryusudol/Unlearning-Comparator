import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONFIG } from "../app/App";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateZoom() {
  const screenWidth = window.innerWidth;

  const totalHeight =
    48 + CONFIG.EXPERIMENTS_PROGRESS_HEIGHT + CONFIG.CORE_HEIGHT;

  const expectedZoom = screenWidth / CONFIG.TOTAL_WIDTH;
  const scaledHeight = totalHeight * expectedZoom;

  if (scaledHeight > window.innerHeight) {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode?.removeChild(outer);

    return (screenWidth - scrollbarWidth) / CONFIG.TOTAL_WIDTH;
  }

  return expectedZoom;
}
