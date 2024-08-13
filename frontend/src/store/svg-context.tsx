import { createContext, useReducer } from "react";

import { State, Action, SvgContextType } from "../types/svg";

const RETRAINED_SVGS = "retrainedSvgs";
const UNLEARNED_SVGS = "unlearnedSvgs";
const initialState: State = { retrainedSvgs: [], unlearnedSvgs: [] };

function svgReducer(state: State, action: Action) {
  switch (action.type) {
    case "SAVE_RETRAINED_SVGS":
      const newRetrainedSvgs = action.payload;
      sessionStorage.setItem(RETRAINED_SVGS, JSON.stringify(newRetrainedSvgs));
      return { ...state, retrainedSvgs: newRetrainedSvgs };

    case "RETRIEVE_RETRAINED_SVGS":
      const savedRetrainedSvgs = sessionStorage.getItem(RETRAINED_SVGS);
      if (!savedRetrainedSvgs)
        return { ...state, retrainedSvgs: [] as string[] };
      try {
        let parsedRetrainedSvgs: string[];
        const parsedSvgs = JSON.parse(savedRetrainedSvgs);
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
      } catch (err) {
        console.error(err);
        return { ...state, retrainedSvgs: [] as string[] };
      }

    case "CLEAR_RETRAINED_SVGS":
      sessionStorage.removeItem(RETRAINED_SVGS);
      return { ...state, retrainedSvgs: [] as string[] };

    case "SAVE_UNLEARNED_SVGS":
      const newdUnlearnedSvgs = action.payload;
      sessionStorage.setItem(UNLEARNED_SVGS, JSON.stringify(newdUnlearnedSvgs));
      return { ...state, unlearnedSvgs: newdUnlearnedSvgs };

    case "RETRIEVE_UNLEARNED_SVGS":
      const savedUnlearnedSvgs = sessionStorage.getItem(UNLEARNED_SVGS);
      if (!savedUnlearnedSvgs)
        return { ...state, unlearnedSvgs: [] as string[] };
      try {
        let parsedUnlearnedSvgs: string[];
        const parsedSvgs = JSON.parse(savedUnlearnedSvgs);
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
      } catch (err) {
        console.error(err);
        return { ...state, unlearnedSvgs: [] as string[] };
      }

    case "CLEAR_UNLEARNED_SVGS":
      sessionStorage.removeItem(UNLEARNED_SVGS);
      return { ...state, unlearnedSvgs: [] as string[] };

    default:
      return state;
  }
}

export const SvgContext = createContext<SvgContextType>({
  retrainedSvgs: [],
  unlearnedSvgs: [],
  saveRetrainedSvgs: () => {},
  retrieveRetrainedSvgs: () => [],
  clearRetrainedSvgs: () => {},
  saveUnlearnedSvgs: () => {},
  retrieveUnlearnedSvgs: () => [],
  clearUnlearnedSvgs: () => {},
});

export default function SvgContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [svgState, svgDispatch] = useReducer(svgReducer, initialState);

  function handleSaveRetrainedSvgs(svgs: string[]) {
    svgDispatch({ type: "SAVE_RETRAINED_SVGS", payload: svgs });
  }

  function handleRetrieveRetrainedSvgs() {
    svgDispatch({ type: "RETRIEVE_RETRAINED_SVGS" });
    return svgState.retrainedSvgs;
  }

  function handleClearRetrainedSvgs() {
    svgDispatch({ type: "CLEAR_RETRAINED_SVGS" });
  }

  function handleSaveUnlearnedSvgs(svgs: string[]) {
    svgDispatch({ type: "SAVE_UNLEARNED_SVGS", payload: svgs });
  }

  function handleRetrieveUnlearnedSvgs() {
    svgDispatch({ type: "RETRIEVE_UNLEARNED_SVGS" });
    return svgState.unlearnedSvgs;
  }

  function handleClearUnlearnedSvgs() {
    svgDispatch({ type: "CLEAR_UNLEARNED_SVGS" });
  }

  const ctxValue: SvgContextType = {
    retrainedSvgs: svgState.retrainedSvgs,
    unlearnedSvgs: svgState.unlearnedSvgs,
    saveRetrainedSvgs: handleSaveRetrainedSvgs,
    retrieveRetrainedSvgs: handleRetrieveRetrainedSvgs,
    clearRetrainedSvgs: handleClearRetrainedSvgs,
    saveUnlearnedSvgs: handleSaveUnlearnedSvgs,
    retrieveUnlearnedSvgs: handleRetrieveUnlearnedSvgs,
    clearUnlearnedSvgs: handleClearUnlearnedSvgs,
  };

  return <SvgContext.Provider value={ctxValue}>{children}</SvgContext.Provider>;
}
