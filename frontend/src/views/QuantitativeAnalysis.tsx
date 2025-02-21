import View from "../components/View";
import Title from "../components/Title";
import ClassWiseAnalysis from "./ClassWiseAnalysis";
import PredictionMatrix from "./PredictionMatrix";
import LayerWiseSimilarity from "./LayerWiseSimilarity";
import { CONFIG } from "../app/App";

export default function QuantitativeAnalysis() {
  return (
    <View
      width={CONFIG.ANALYSIS_VIEW_WIDTH}
      height={CONFIG.TOTAL_HEIGHT}
      className="flex flex-col"
    >
      <Title title="Qualitative Analysis" />
      <ClassWiseAnalysis />
      <PredictionMatrix />
      <LayerWiseSimilarity />
    </View>
  );
}
