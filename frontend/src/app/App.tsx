import { useState, useEffect, useContext } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import Header from "../components/Header";
import Experiments from "../views/Experiments";
import RunningStatus from "../views/Progress";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";

const UPPER_SECTION_HEIGHT = 234;
const LOWER_SECTION_HEIGHT = 677;

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
    <section className="w-[1822px] relative">
      <Header />
      {!experimentLoading && (
        <>
          <div className="flex items-center">
            <Experiments height={UPPER_SECTION_HEIGHT} />
            <RunningStatus height={UPPER_SECTION_HEIGHT} />
            <Accuracies height={UPPER_SECTION_HEIGHT} />
          </div>
          <div className="flex">
            <Core height={LOWER_SECTION_HEIGHT} />
            <div className="flex flex-col">
              <Predictions
                height={260}
                isExpanded={isPredictionsExpanded}
                onExpansionClick={handleExpansionClick}
              />
              <Correlations height={LOWER_SECTION_HEIGHT - 260} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
