import { useState, useEffect, useContext } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import Header from "../components/Header";
import Experiments from "../views/Experiments";
import Progress from "../views/Progress";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";

const ANALYSIS_VIEW_WIDTH = 493;

export default function App() {
  const { isExperimentLoading } = useContext(ExperimentsContext);

  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    setIsPageLoading(false);
  }, []);

  if (isPageLoading) return <div></div>;

  return (
    <section className="w-[1805px] relative">
      <Header />
      {!isExperimentLoading && (
        <div className="flex items-center">
          <div>
            <div className="flex items-center">
              <Experiments height={234} />
              <Progress height={234} />
            </div>
            <Core height={677} />
          </div>
          <div>
            <Accuracies width={ANALYSIS_VIEW_WIDTH} height={293} />
            <Predictions width={ANALYSIS_VIEW_WIDTH} height={316} />
            <Correlations width={ANALYSIS_VIEW_WIDTH} height={302} />
          </div>
        </div>
      )}
    </section>
  );
}
