import { createContext, useEffect, useReducer } from "react";

import {
  OverviewList,
  Action,
  OverviewContextType,
} from "../types/overview-context";

const OVERVIEW = "overview";

export const OverviewContext = createContext<OverviewContextType>({
  overview: [],

  saveOverview: (overview: OverviewList) => {},
  retrieveOverview: () => {},
  deleteLastOverviewItem: () => {},
  clearOverview: () => {},
});

function overviewReducer(state: OverviewList, action: Action): OverviewList {
  switch (action.type) {
    case "SAVE_OVERVIEW":
      const overview = action.payload;
      sessionStorage.setItem(OVERVIEW, JSON.stringify(overview));
      return { overview: overview.overview };

    case "RETRIEVE_OVERVIEW":
      const savedOverview = sessionStorage.getItem(OVERVIEW);
      if (savedOverview) {
        const parsedOverview: OverviewList = JSON.parse(savedOverview);
        return { overview: parsedOverview.overview };
      }
      return state;

    case "DELETE_LAST_OVERVIEW_ITEM":
      const savedData = sessionStorage.getItem(OVERVIEW);
      if (savedData) {
        const parsedData: OverviewList = JSON.parse(savedData);
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

  function handleSaveOverview(overview: OverviewList) {
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

  useEffect(() => {
    handleRetrieveOverview();
  }, []);

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
