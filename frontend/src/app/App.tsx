import { useState, useEffect, useCallback } from "react";

import Header from "../components/Header/Header";
import ModelScreening from "../views/ModelScreening";
import Core from "../views/Core";
import QuantitativeAnalysis from "../views/QuantitativeAnalysis";
import { useExperimentsStore } from "../stores/experimentsStore";
import { calculateZoom } from "../utils/util";

export const CONFIG = {
  TOTAL_WIDTH: 1805,
  EXPERIMENTS_WIDTH: 1032,
  CORE_WIDTH: 1312,
  get PROGRESS_WIDTH() {
    return this.CORE_WIDTH - this.EXPERIMENTS_WIDTH - 1;
  },
  get ANALYSIS_VIEW_WIDTH() {
    return this.TOTAL_WIDTH - this.CORE_WIDTH;
  },

  EXPERIMENTS_PROGRESS_HEIGHT: 245,
  CORE_HEIGHT: 720,
  get TOTAL_HEIGHT() {
    return this.CORE_HEIGHT + this.EXPERIMENTS_PROGRESS_HEIGHT;
  },
} as const;

export default function App() {
  const { isExperimentLoading } = useExperimentsStore();

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  const handleResize = useCallback(() => {
    setZoom(calculateZoom());
  }, []);

  useEffect(() => {
    setIsPageLoading(false);

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  if (isPageLoading) return <></>;

  return (
    <section className="relative" style={{ zoom }}>
      <Header />
      {!isExperimentLoading && (
        <div className="flex items-center">
          <div>
            <ModelScreening />
            <Core />
          </div>
          <QuantitativeAnalysis />
        </div>
      )}
    </section>
  );
}
