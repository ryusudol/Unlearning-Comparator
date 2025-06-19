import View from "../../components/common/View";
import Title from "../../components/common/Title";
import ClassWiseAccuracy from "./ClassWiseAccuracy";
import PredictionMatrix from "./PredictionMatrix";
import LayerWiseSimilarity from "./LayerWiseSimilarity";
import { CONFIG } from "../../app/App";
import { useDatasetMode } from "../../hooks/useDatasetMode";

export default function MetricsCore() {
  const datasetMode = useDatasetMode();

  return (
    <View
      width={CONFIG.ANALYSIS_VIEW_WIDTH}
      height={CONFIG.TOTAL_HEIGHT}
      borderLeft
      borderBottom
    >
      <Title title="Metrics View" className="left-0.5" />
      <div className="flex flex-col gap-6">
        <ClassWiseAccuracy />
        <PredictionMatrix />
        {datasetMode === "cifar10" && <LayerWiseSimilarity />}
      </div>
    </View>
  );
}
