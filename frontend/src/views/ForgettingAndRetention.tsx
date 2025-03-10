import View from "../components/View";
import Title from "../components/Title";
import ClassWiseAnalysis from "./ClassWiseAnalysis";
import PredictionMatrix from "./PredictionMatrix";
import LayerWiseSimilarity from "./LayerWiseSimilarity";
import { CONFIG } from "../app/App";

export default function ForgettingAndRetention() {
  return (
    <View
      width={CONFIG.ANALYSIS_VIEW_WIDTH}
      height={CONFIG.TOTAL_HEIGHT}
      borderLeft
    >
      <Title title="Forgetting and Retention" className="left-0.5" />
      <div className="flex flex-col gap-6">
        <ClassWiseAnalysis />
        <PredictionMatrix />
        <LayerWiseSimilarity />
      </div>
    </View>
  );
}
