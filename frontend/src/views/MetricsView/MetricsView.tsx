import View from "../../components/common/View";
import Title from "../../components/common/Title";
import ClassWiseAnalysis from "./ClassWiseAnalysis";
import PredictionMatrix from "./PredictionMatrix";
import LayerWiseSimilarity from "./LayerWiseSimilarity";
import { CONFIG } from "../../app/App";

export default function MetricsCore() {
  return (
    <View
      width={CONFIG.ANALYSIS_VIEW_WIDTH}
      height={CONFIG.TOTAL_HEIGHT}
      borderLeft
      borderBottom
    >
      <Title title="Metrics View" className="left-0.5" />
      <div className="flex flex-col gap-6">
        <ClassWiseAnalysis />
        <PredictionMatrix />
        <LayerWiseSimilarity />
      </div>
    </View>
  );
}
