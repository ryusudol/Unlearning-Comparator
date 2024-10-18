import { useState, useEffect } from "react";

import Header from "../components/Header";
import Settings from "../views/Experiments";
import Overview from "../views/Overview";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";

const UPPER_HEIGHT = 260;
const LOWER_HEIGHT = 757;

export default function App() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPredictionsExpanded, setIsPredictionsExpanded] = useState(false);

  useEffect(() => {
    setIsPageLoading(false);
  }, []);

  if (isPageLoading) return <div>Loading . . .</div>;

  const handleExpansionClick = () => {
    setIsPredictionsExpanded((isPredictionsExpanded) => !isPredictionsExpanded);
  };

  return (
    <section className="relative">
      <Header />
      <div className="flex">
        <Settings height={UPPER_HEIGHT} />
        <Overview height={UPPER_HEIGHT} />
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
    </section>
  );
}
