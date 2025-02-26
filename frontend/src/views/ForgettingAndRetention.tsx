import View from "../components/View";
import Title from "../components/Title";
import ClassWiseAnalysis from "./ClassWiseAnalysis";
import PredictionMatrix from "./PredictionMatrix";
import LayerWiseSimilarity from "./LayerWiseSimilarity";
import { CONFIG } from "../app/App";

export default function ForgettingAndRetention() {
  return (
    <View width={CONFIG.ANALYSIS_VIEW_WIDTH} height={CONFIG.TOTAL_HEIGHT}>
      <Title title="Forgetting and Retention" />
      <div className="flex flex-col gap-5">
        <ClassWiseAnalysis />
        <PredictionMatrix />
        <LayerWiseSimilarity />
      </div>
    </View>
  );
}
