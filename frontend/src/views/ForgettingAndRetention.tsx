import View from "../components/View";
import Title from "../components/Title";
import ClassWiseAnalysis from "./ClassWiseAnalysis";
import PredictionMatrix from "./PredictionMatrix";
import LayerWiseSimilarity from "./LayerWiseSimilarity";
import { CONFIG } from "../app/App";

export default function ForgettingAndRetention() {
  return (
    <View
      className="border-t-0 border-r-0 border-b-0"
      width={CONFIG.ANALYSIS_VIEW_WIDTH}
      height={CONFIG.TOTAL_HEIGHT}
      borderLeft
    >
      <Title title="Forgetting and Retention" />
      <div className="flex flex-col gap-[26px]">
        <ClassWiseAnalysis />
        <PredictionMatrix />
        <LayerWiseSimilarity />
      </div>
    </View>
  );
}
