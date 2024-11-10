import { useState, useEffect, useContext } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import Header from "../components/Header";
import Experiments from "../views/Experiments";
import RunningStatus from "../views/RunningStatus";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";

const UPPER_HEIGHT = 260;
const LOWER_HEIGHT = 757;

export default function App() {
  const { experimentLoading } = useContext(ExperimentsContext);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPredictionsExpanded, setIsPredictionsExpanded] = useState(false);

  useEffect(() => {
    setIsPageLoading(false);
  }, []);

  if (isPageLoading) return <div></div>;

  const handleExpansionClick = () => {
    setIsPredictionsExpanded((prev) => !prev);
  };

  return (
    <section className="w-[2042px] relative">
      <Header />
      {!experimentLoading && (
        <>
          <div className="flex items-center">
            <Experiments height={UPPER_HEIGHT} />
            <RunningStatus height={UPPER_HEIGHT} />
            <Accuracies height={UPPER_HEIGHT} />
          </div>
          <div className="flex">
            <Core height={LOWER_HEIGHT} />
            <div className="flex flex-col">
              <Predictions
                height={289}
                isExpanded={isPredictionsExpanded}
                onExpansionClick={handleExpansionClick}
              />
              <Correlations height={LOWER_HEIGHT - 289} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
