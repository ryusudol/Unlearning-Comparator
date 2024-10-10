import { useState, useEffect } from "react";

import Header from "../components/Header";
import Settings from "../views/Settings";
import Overview from "../views/Overview";
import Accuracies from "../views/Accuracies";
import Core from "../views/Core";
import Predictions from "../views/Predictions";
import Correlations from "../views/Correlations";

const UPPER_HEIGHT = 290;
const LOWER_HEIGHT = 720;

export default function App() {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    setIsPageLoading(false);
  }, []);

  if (isPageLoading) {
    return <div>Loading . . .</div>;
  }

  return (
    <section>
      <Header />
      <div className="flex">
        <Settings height={UPPER_HEIGHT} />
        <Overview height={UPPER_HEIGHT} />
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
