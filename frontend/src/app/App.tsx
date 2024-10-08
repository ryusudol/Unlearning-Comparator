import { useState, useEffect, useContext, useCallback } from "react";

import Header from "../components/Header";
import Settings from "../views/Settings";
import PerformanceOverview from "../views/PerformanceOverview";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";
import { OverviewContext } from "../store/overview-context";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";

const UPPER_HEIGHT = 290;
const LOWER_HEIGHT = 720;

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const { retrieveContext } = useContext(BaselineComparisonContext);
  const { retrieveOverview } = useContext(OverviewContext);

  const handleRefresh = useCallback(() => {
    retrieveContext();
    retrieveOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRefresh();
    setIsLoading(false);
  }, [handleRefresh]);

  if (isLoading) {
    return <div>Loading . . .</div>;
  }

  return (
    <section>
      <Header />
      <div className="flex">
        <Settings height={UPPER_HEIGHT} />
        <PerformanceOverview height={UPPER_HEIGHT} />
        <Accuracies height={UPPER_HEIGHT} />
      </div>
      <div className="flex">
        <Core height={LOWER_HEIGHT} />
        <div className="flex flex-col">
          <Predictions height={257} />
          <Correlations height={LOWER_HEIGHT - 257} />
        </div>
      </div>
    </section>
  );
}
