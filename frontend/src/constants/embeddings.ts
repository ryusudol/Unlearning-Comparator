import { ViewMode } from "../types/embeddings";

export const VIEW_MODES: ViewMode[] = [
  {
    label: "All",
    explanation: "Show entire dataset",
    length: 50,
  },
  {
    label: "Target to Forget",
    explanation: "All instances from the forget class",
    length: 125,
  },
  {
    label: "Correctly Forgotten",
    explanation: "Instances from the forget class successfully unlearned",
    length: 145,
  },
  {
    label: "Not Forgotten",
    explanation: "Instances from the forget class not unlearned",
    length: 110,
  },
  {
    label: "Overly Forgotten",
    explanation: "Instances from the retain class mistakenly unlearned",
    length: 130,
  },
];

// export const VIEW_MODES: ViewMode[] = [
//   {
//     label: "All",
//     explanation: "Show entire dataset",
//     length: 58,
//   },
//   {
//     label: "Target to Forget",
//     explanation: "All instances from the forget class",
//     length: 134,
//   },
//   {
//     label: "Correctly Forgotten",
//     explanation: "Instances from the forget class successfully unlearned",
//     length: 154,
//   },
//   {
//     label: "Not Forgotten",
//     explanation: "Instances from the forget class not unlearned",
//     length: 118,
//   },
//   {
//     label: "Overly Forgotten",
//     explanation: "Instances from the retain class mistakenly unlearned",
//     length: 138,
//   },
// ];
