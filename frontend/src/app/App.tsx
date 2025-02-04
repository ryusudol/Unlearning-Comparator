import { useState, useEffect, useContext, useCallback } from "react";

import Header from "../components/Header/Header";
import Experiments from "../views/Experiments";
import Progress from "../views/Progress";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";
import { ExperimentsContext } from "../store/experiments-context";
import { calculateZoom } from "../utils/util";
import {
  CORE_WIDTH,
  EXPERIMENTS_WIDTH,
  ANALYSIS_VIEW_WIDTH,
  PROGRESS_WIDTH,
  CORE_HEIGHT,
  EXPERIMENTS_PROGRESS_HEIGHT,
  ACCURACIES_HEIGHT,
  PREDICTIONS_HEIGHT,
  CORRELATIONS_HEIGHT,
} from "../constants/layout";

export default function App() {
  const { isExperimentLoading } = useContext(ExperimentsContext);

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
        <div className="flex items-start">
          <div>
            <div className="flex items-center">
              <Experiments
                width={EXPERIMENTS_WIDTH}
                height={EXPERIMENTS_PROGRESS_HEIGHT}
              />
              <Progress
                width={PROGRESS_WIDTH}
                height={EXPERIMENTS_PROGRESS_HEIGHT}
              />
            </div>
            <Core width={CORE_WIDTH} height={CORE_HEIGHT} />
          </div>
          <div>
            <Accuracies
              width={ANALYSIS_VIEW_WIDTH}
              height={ACCURACIES_HEIGHT}
            />
            <Predictions
              width={ANALYSIS_VIEW_WIDTH}
              height={PREDICTIONS_HEIGHT}
            />
            <Correlations
              width={ANALYSIS_VIEW_WIDTH}
              height={CORRELATIONS_HEIGHT}
            />
          </div>
        </div>
      )}
    </section>
  );
}
