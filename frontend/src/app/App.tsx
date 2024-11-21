import { useState, useEffect, useContext } from "react";

import { ExperimentsContext } from "../store/experiments-context";
import Header from "../components/Header";
import Experiments from "../views/Experiments";
import RunningStatus from "../views/Progress";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";

export default function App() {
  const { experimentLoading } = useContext(ExperimentsContext);

  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    setIsPageLoading(false);
  }, []);

  if (isPageLoading) return <div></div>;

  return (
    <section className="w-[1822px] relative">
      <Header />
      {!experimentLoading && (
        <div className="flex items-center">
          <div>
            <div className="flex items-center">
              <Experiments height={234} />
              <RunningStatus height={234} />
            </div>
            <Core height={677} />
          </div>
          <div>
            <Accuracies height={300} />
            <Predictions height={300} />
            <Correlations height={311} />
          </div>
        </div>
      )}
    </section>
  );
}
