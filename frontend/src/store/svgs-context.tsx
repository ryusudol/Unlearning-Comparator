import { createContext, useReducer } from "react";

import { Svgs, Action, SvgsContextType } from "../types/svgs-context";

const RETRAINING_SVGS = "retrainingSvgs";
const UNLEARNING_SVGS = "unlearningSvgs";

export const SvgsContext = createContext<SvgsContextType>({
  retrainingSvgs: [],
  unlearningSvgs: [],

  saveRetrainingSvgs: () => {},
  saveUnlearningSvgs: () => {},

  retrieveRetrainingSvgs: () => [],
  retrieveUnlearningSvgs: () => [],

  clearRetrainingSvgs: () => {},
  clearUnlearningSvgs: () => {},
});

function ContentReducer(state: Svgs, action: Action): Svgs {
  switch (action.type) {
    case "SAVE_RETRAINED_SVGS":
      const newRetrainedSvgs = action.payload;
      sessionStorage.setItem(RETRAINING_SVGS, JSON.stringify(newRetrainedSvgs));
      return { ...state, retrainingSvgs: newRetrainedSvgs };

    case "SAVE_UNLEARNED_SVGS":
      const newdUnlearnedSvgs = action.payload;
      sessionStorage.setItem(
        UNLEARNING_SVGS,
        JSON.stringify(newdUnlearnedSvgs)
      );
      return { ...state, unlearningSvgs: newdUnlearnedSvgs };

    case "RETRIEVE_RETRAINED_SVGS":
      const savedRetrainedSvgs = sessionStorage.getItem(RETRAINING_SVGS);
      if (!savedRetrainedSvgs)
        return { ...state, retrainingSvgs: [] as string[] };
      try {
        let parsedRetrainedSvgs: string[];
        const parsedSvgs: string[] = JSON.parse(savedRetrainedSvgs);
        if (
          Array.isArray(parsedSvgs) &&
          parsedSvgs.length === 4 &&
          parsedSvgs.every((item: any) => typeof item === "string")
        ) {
          parsedRetrainedSvgs = parsedSvgs;
        } else {
          parsedRetrainedSvgs = [];
        }
        return { ...state, retrainingSvgs: parsedRetrainedSvgs };
      } catch (error) {
        console.error(error);
        return { ...state, retrainingSvgs: [] as string[] };
      }

    case "RETRIEVE_UNLEARNED_SVGS":
      const savedUnlearnedSvgs = sessionStorage.getItem(UNLEARNING_SVGS);
      if (!savedUnlearnedSvgs)
        return { ...state, unlearningSvgs: [] as string[] };
      try {
        let parsedUnlearnedSvgs: string[];
        const parsedSvgs: string[] = JSON.parse(savedUnlearnedSvgs);
        if (
          Array.isArray(parsedSvgs) &&
          parsedSvgs.length === 4 &&
          parsedSvgs.every((item: any) => typeof item === "string")
        ) {
          parsedUnlearnedSvgs = parsedSvgs;
        } else {
          parsedUnlearnedSvgs = [] as string[];
        }
        return { ...state, unlearningSvgs: parsedUnlearnedSvgs };
      } catch (error) {
        console.error(error);
        return { ...state, unlearningSvgs: [] as string[] };
      }

    case "CLEAR_RETRAINED_SVGS":
      sessionStorage.removeItem(RETRAINING_SVGS);
      return { ...state, retrainingSvgs: [] as string[] };

    case "CLEAR_UNLEARNED_SVGS":
      sessionStorage.removeItem(UNLEARNING_SVGS);
      return { ...state, unlearningSvgs: [] as string[] };

    default:
      return state;
  }
}

export default function SvgsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contentState, dispatch] = useReducer(ContentReducer, {
    retrainingSvgs: [],
    unlearningSvgs: [],
  });

  // Save
  function handlesaveRetrainingSvgs(svgs: string[]) {
    dispatch({ type: "SAVE_RETRAINED_SVGS", payload: svgs });
  }

  function handlesaveUnlearningSvgs(svgs: string[]) {
    dispatch({ type: "SAVE_UNLEARNED_SVGS", payload: svgs });
  }

  // Retrieve
  const handleretrieveRetrainingSvgs = function handleretrieveRetrainingSvgs() {
    dispatch({ type: "RETRIEVE_RETRAINED_SVGS" });
    return contentState.retrainingSvgs;
  };

  const handleretrieveUnlearningSvgs = function handleretrieveUnlearningSvgs() {
    dispatch({ type: "RETRIEVE_UNLEARNED_SVGS" });
    return contentState.unlearningSvgs;
  };

  // Clear
  function handleclearRetrainingSvgs() {
    dispatch({ type: "CLEAR_RETRAINED_SVGS" });
  }

  function handleclearUnlearningSvgs() {
    dispatch({ type: "CLEAR_UNLEARNED_SVGS" });
  }

  const ctxValue: SvgsContextType = {
    retrainingSvgs: contentState.retrainingSvgs,
    unlearningSvgs: contentState.unlearningSvgs,

    saveRetrainingSvgs: handlesaveRetrainingSvgs,
    saveUnlearningSvgs: handlesaveUnlearningSvgs,

    retrieveRetrainingSvgs: handleretrieveRetrainingSvgs,
    retrieveUnlearningSvgs: handleretrieveUnlearningSvgs,

    clearRetrainingSvgs: handleclearRetrainingSvgs,
    clearUnlearningSvgs: handleclearUnlearningSvgs,
  };

  return (
    <SvgsContext.Provider value={ctxValue}>{children}</SvgsContext.Provider>
  );
}
