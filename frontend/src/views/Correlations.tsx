import { useState } from "react";

import View from "../components/View";
import Title from "../components/Title";
import Indicator from "../components/Indicator";
import LineChart from "../components/Correlations/LineChart";
import DatasetModeSelector from "../components/DatasetModeSelector";
import { useModelSelection } from "../hooks/useModelSelection";
import { useForgetClass } from "../hooks/useForgetClass";
import { ViewProps } from "../types/common";
import { TRAIN } from "../constants/common";

export default function Correlations({ width, height }: ViewProps) {
  const { forgetClassExist } = useForgetClass();
  const { areAllModelsSelected } = useModelSelection();

  const [dataset, setDataset] = useState(TRAIN);

  return (
    <View width={width} height={height}>
      <div className="flex justify-between">
        <Title title="Layer-Wise Correlation View" customClass="bottom-[2px]" />
        {forgetClassExist && areAllModelsSelected && (
          <DatasetModeSelector onValueChange={setDataset} />
        )}
      </div>
      {forgetClassExist ? (
        areAllModelsSelected ? (
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
