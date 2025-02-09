import { useState, useEffect } from "react";
import * as d3 from "d3";

import AttackPlot from "./AttackPlot";
import AttackSuccessFailure from "./AttackSuccessFailure";
import { AttackData } from "../../types/privacy-attack";

interface Props {
  mode: "Baseline" | "Comparison";
}

export default function AttackAnalytics({ mode }: Props) {
  const [threshold, setThreshold] = useState<number>(1.25);
  const [attackScore, setAttackScore] = useState<number>(0);

  const [data, setData] = useState<{
    retrainJson: any;
    ga3Json: any;
    attackData: AttackData[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      d3.json<any>("class_1_Retrain.json"),
      d3.json<any>("Class_1_GA3.json"),
      d3.json<AttackData[]>("Entropy_Scores_from_Attack_Exp.json"),
    ]).then(([retrainJson, ga3Json, attackData]) => {
      if (!retrainJson || !ga3Json || !attackData) return;
      setData({ retrainJson, ga3Json, attackData });
    });
  }, []);

  return (
    <div className="h-full flex flex-col">
      {data && (
        <AttackPlot
          mode={mode}
          threshold={threshold}
          setThreshold={setThreshold}
          retrainJson={data.retrainJson}
          ga3Json={data.ga3Json}
          attackData={data.attackData}
          onUpdateAttackScore={setAttackScore}
        />
      )}
      {data && (
        <AttackSuccessFailure
          mode={mode}
          threshold={threshold}
          retrainJson={data.retrainJson}
          ga3Json={data.ga3Json}
          attackScore={attackScore}
        />
      )}
    </div>
  );
}
