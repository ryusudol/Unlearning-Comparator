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
  retrieveOverview: () => {},
  deleteLastOverviewItem: () => {},
  clearOverview: () => {},
});

function overviewReducer(state: Overview, action: Action): Overview {
  switch (action.type) {
    case "SAVE_OVERVIEW":
      const overview = action.payload;
      sessionStorage.setItem(OVERVIEW, JSON.stringify(overview));
      return { overview: overview.overview };

    case "RETRIEVE_OVERVIEW":
      const savedOverview = sessionStorage.getItem(OVERVIEW);
      if (savedOverview) {
        const parsedOverview: Overview = JSON.parse(savedOverview);
        return { overview: parsedOverview.overview };
      }
      return state;

    case "DELETE_LAST_OVERVIEW_ITEM":
      const savedData = sessionStorage.getItem(OVERVIEW);
      if (savedData) {
        const parsedData: Overview = JSON.parse(savedData);
        const updatedOverview = parsedData.overview.slice(0, -1);
        sessionStorage.setItem(
          OVERVIEW,
          JSON.stringify({ overview: updatedOverview })
        );
        return { overview: updatedOverview };
      }
      return state;

    case "CLEAR_OVERVIEW":
      sessionStorage.removeItem(OVERVIEW);
      return { overview: [] };

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
  }

  function handleDeleteOverviewItem() {
    dispatch({ type: "DELETE_LAST_OVERVIEW_ITEM" });
  }

  function handleClearOverview() {
    dispatch({ type: "CLEAR_OVERVIEW" });
  }

  const ctxValue = {
    overview: overview.overview,

    saveOverview: handleSaveOverview,
    retrieveOverview: handleRetrieveOverview,
    deleteLastOverviewItem: handleDeleteOverviewItem,
    clearOverview: handleClearOverview,
  };

  return (
    <OverviewContext.Provider value={ctxValue}>
      {children}
    </OverviewContext.Provider>
  );
}
