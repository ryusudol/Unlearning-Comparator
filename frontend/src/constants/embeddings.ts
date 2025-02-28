import { ViewMode } from "../types/embeddings";

export const VIEW_MODES: ViewMode[] = [
  {
    label: "Target to Forget",
    explanation: "All instances from the forget class",
    length: 130,
  },
  {
    label: "Correctly Forgotten",
    explanation: "Instances from the forget class successfully unlearned",
    length: 150,
  },
  {
    label: "Not Forgotten",
    explanation: "Instances from the forget class not unlearned",
    length: 135,
  },
  {
    label: "Overly Forgotten",
    explanation: "Instances from the retain class mistakenly unlearned",
    length: 140,
  },
];
