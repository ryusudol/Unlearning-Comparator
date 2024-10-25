import React from "react";

export default function Section({ children }) {
  return <section>{children}</section>;
}

// Experiments: className="relative px-1 py-0.5 flex flex-col justify-start items-start border-[1px]"
// Overview: className="p-1 relative border-x-[1px] border-b-[1px]"
// Accuracies: className="px-[5px] py-0.5 flex flex-col border-[1px] border-solid relative"
// Core: className="px-[5px] py-0.5 border-[1px] border-solid"
// Embeddings: className="h-[715px] flex justify-start px-1.5 items-center border-[1px] border-solid rounded-b-[6px] rounded-tr-[6px]"
// PrivacyAttacks: className="h-[683px] flex justify-evenly items-center border-[1px] border-solid rounded-[6px]"
// Predictions: className={`px-[5px] py-0.5 flex flex-col border-[1px] border-solid transition-all z-10 bg-white absolute ${isExpanded ? `w-[980px] right-0 top-[35px]` : `w-[490px] top-[324px]`}`}
// Correlation: className="px-[5px] mt-[289px] py-0.5 flex flex-col border-[1px] border-solid relative"

// Common:
