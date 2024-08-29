import { createContext, useReducer } from "react";

import {
  Overview,
  Action,
  OverviewContextType,
} from "../types/overview-context";

const OVERVIEW = "overview";

export const OverviewContext = createContext<OverviewContextType>({
  overview: [],

  saveOverview: (overview: Overview) => {},
  retrieveOverview: () => {
    return [] as unknown as Overview;
  },
  clearOverview: () => {},
});

function overviewReducer(state: Overview, action: Action): Overview {
  switch (action.type) {
    case "SAVE_OVERVIEW":
      const overview = action.payload;
      sessionStorage.setItem(OVERVIEW, JSON.stringify(overview));
      return {
        ...state,
        overview: overview.overview,
      };

    case "RETRIEVE_OVERVIEW":
      const savedOverview = sessionStorage.getItem(OVERVIEW);
      if (!savedOverview) return { ...state, overview: [] };
      try {
        const parsedOverview: Overview = JSON.parse(savedOverview);
        return {
          ...state,
          overview: parsedOverview.overview,
        };
      } catch (error) {
        console.error(error);
        return { ...state, overview: [] };
      }

    case "CLEAR_OVERVIEW":
      sessionStorage.removeItem(OVERVIEW);
      return { ...state, overview: [] };

    default:
      return state;
  }
}

export default function OverviewContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overview, dispatch] = useReducer(overviewReducer, {
    overview: [],
  });

  function handleSaveOverview(overview: Overview) {
    dispatch({ type: "SAVE_OVERVIEW", payload: overview });
  }

  function handleRetrieveOverview() {
    dispatch({ type: "RETRIEVE_OVERVIEW" });
    return { overview: overview.overview };
  }

  function handleClearOverview() {
    dispatch({ type: "CLEAR_OVERVIEW" });
  }

  const ctxValue = {
    overview: overview.overview,

    saveOverview: handleSaveOverview,
    retrieveOverview: handleRetrieveOverview,
    clearOverview: handleClearOverview,
  };

  return (
    <OverviewContext.Provider value={ctxValue}>
      {children}
    </OverviewContext.Provider>
  );
}
