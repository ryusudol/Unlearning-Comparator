import { createContext, useReducer } from "react";

import { Svgs, Action, SvgsContextType } from "../types/svgs-context";

const RETRAINED_SVGS = "retrainedSvgs";
const UNLEARNED_SVGS = "unlearnedSvgs";

export const SvgsContext = createContext<SvgsContextType>({
  retrainedSvgs: [],
  unlearnedSvgs: [],

  saveRetrainedSvgs: () => {},
  saveUnlearnedSvgs: () => {},

  retrieveRetrainedSvgs: () => [],
  retrieveUnlearnedSvgs: () => [],

  clearRetrainedSvgs: () => {},
  clearUnlearnedSvgs: () => {},
});

function ContentReducer(state: Svgs, action: Action): Svgs {
  switch (action.type) {
    case "SAVE_RETRAINED_SVGS":
      const newRetrainedSvgs = action.payload;
      sessionStorage.setItem(RETRAINED_SVGS, JSON.stringify(newRetrainedSvgs));
      return { ...state, retrainedSvgs: newRetrainedSvgs };

    case "SAVE_UNLEARNED_SVGS":
      const newdUnlearnedSvgs = action.payload;
      sessionStorage.setItem(UNLEARNED_SVGS, JSON.stringify(newdUnlearnedSvgs));
      return { ...state, unlearnedSvgs: newdUnlearnedSvgs };

    case "RETRIEVE_RETRAINED_SVGS":
      const savedRetrainedSvgs = sessionStorage.getItem(RETRAINED_SVGS);
      if (!savedRetrainedSvgs)
        return { ...state, retrainedSvgs: [] as string[] };
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
        return { ...state, retrainedSvgs: parsedRetrainedSvgs };
      } catch (error) {
        console.error(error);
        return { ...state, retrainedSvgs: [] as string[] };
      }

    case "RETRIEVE_UNLEARNED_SVGS":
      const savedUnlearnedSvgs = sessionStorage.getItem(UNLEARNED_SVGS);
      if (!savedUnlearnedSvgs)
        return { ...state, unlearnedSvgs: [] as string[] };
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
        return { ...state, unlearnedSvgs: parsedUnlearnedSvgs };
      } catch (error) {
        console.error(error);
        return { ...state, unlearnedSvgs: [] as string[] };
      }

    case "CLEAR_RETRAINED_SVGS":
      sessionStorage.removeItem(RETRAINED_SVGS);
      return { ...state, retrainedSvgs: [] as string[] };

    case "CLEAR_UNLEARNED_SVGS":
      sessionStorage.removeItem(UNLEARNED_SVGS);
      return { ...state, unlearnedSvgs: [] as string[] };

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
    retrainedSvgs: [],
    unlearnedSvgs: [],
  });

  // Save
  function handleSaveRetrainedSvgs(svgs: string[]) {
    dispatch({ type: "SAVE_RETRAINED_SVGS", payload: svgs });
  }

  function handleSaveUnlearnedSvgs(svgs: string[]) {
    dispatch({ type: "SAVE_UNLEARNED_SVGS", payload: svgs });
  }

  // Retrieve
  const handleRetrieveRetrainedSvgs = function handleRetrieveRetrainedSvgs() {
    dispatch({ type: "RETRIEVE_RETRAINED_SVGS" });
    return contentState.retrainedSvgs;
  };

  const handleRetrieveUnlearnedSvgs = function handleRetrieveUnlearnedSvgs() {
    dispatch({ type: "RETRIEVE_UNLEARNED_SVGS" });
    return contentState.unlearnedSvgs;
  };

  // Clear
  function handleClearRetrainedSvgs() {
    dispatch({ type: "CLEAR_RETRAINED_SVGS" });
  }

  function handleClearUnlearnedSvgs() {
    dispatch({ type: "CLEAR_UNLEARNED_SVGS" });
  }

  const ctxValue: SvgsContextType = {
    retrainedSvgs: contentState.retrainedSvgs,
    unlearnedSvgs: contentState.unlearnedSvgs,

    saveRetrainedSvgs: handleSaveRetrainedSvgs,
    saveUnlearnedSvgs: handleSaveUnlearnedSvgs,

    retrieveRetrainedSvgs: handleRetrieveRetrainedSvgs,
    retrieveUnlearnedSvgs: handleRetrieveUnlearnedSvgs,

    clearRetrainedSvgs: handleClearRetrainedSvgs,
    clearUnlearnedSvgs: handleClearUnlearnedSvgs,
  };

  return (
    <SvgsContext.Provider value={ctxValue}>{children}</SvgsContext.Provider>
  );
}
