import { useState, useContext } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import LineChart from "../components/Correlations/LineChart";
import DatasetModeSelector from "../components/DatasetModeSelector";
import { ViewProps } from "../types/common";
import { Layers02Icon } from "../components/UI/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { TRAIN } from "../constants/common";

export default function Correlations({ width, height }: ViewProps) {
  const { baseline, comparison } = useContext(BaselineComparisonContext);
  const { forgetClass } = useContext(ForgetClassContext);

  const [dataset, setDataset] = useState(TRAIN);

  const forgetClassExist = forgetClass !== undefined;
  const bothBaseCompExist = baseline !== "" && comparison !== "";

  return (
    <View width={width} height={height}>
      <div className="flex justify-between">
        <Title
          Icon={<Layers02Icon />}
          title="Layer-Wise Correlations"
          customClass="bottom-[2px]"
        />
        {forgetClassExist && bothBaseCompExist && (
          <DatasetModeSelector onValueChange={setDataset} />
        )}
      </div>
      {forgetClassExist ? (
        bothBaseCompExist ? (
          <LineChart dataset={dataset} />
        ) : (
          <Indicator about="BaselineComparison" />
        )
      ) : (
        <Indicator about="ForgetClass" />
      )}
    </View>
  );
}
