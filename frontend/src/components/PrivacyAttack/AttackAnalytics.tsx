import { useState } from "react";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";

interface Props {
  mode: "Baseline" | "Comparison";
}

export default function AttackAnalytics({ mode }: Props) {
  const [threshold, setThreshold] = useState<number>(1.25);

  return (
    <div className="flex flex-col">
      <AttackPlot
        mode={mode}
        threshold={threshold}
        setThreshold={setThreshold}
      />
      <AttackSuccessFailure />
    </div>
  );
}
