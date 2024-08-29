import { createContext, useReducer } from "react";

import {
  SelectedID,
  SelectedIDContextType,
  Action,
} from "../types/selected-id-context";

const OVERVIEW = "overview";

export const SelectedIDContext = createContext<SelectedIDContextType>({
  selectedID: 0,

  saveSelectedID: (id: number) => {},
  retrieveSelectedID: () => {
    return { selectedID: 0 } as SelectedID;
  },
  clearSelectedID: () => {},
});

function selectedIDReducer(state: SelectedID, action: Action): SelectedID {
  switch (action.type) {
    case "SAVE_SELECTED_ID":
      const id = action.payload;
      sessionStorage.setItem(OVERVIEW, JSON.stringify(id));
      return {
        ...state,
        selectedID: id,
      };

    case "RETRIEVE_SELECTED_ID":
      const savedOverview = sessionStorage.getItem(OVERVIEW);
      if (!savedOverview) return { ...state, selectedID: 0 };
      try {
        const parsedOverview: SelectedID = JSON.parse(savedOverview);
        return {
          ...state,
          selectedID: parsedOverview.selectedID,
        };
      } catch (error) {
        console.error(error);
        return { ...state, selectedID: 0 };
      }

    case "CLEAR_SELECTED_ID":
      sessionStorage.removeItem(OVERVIEW);
      return { ...state, selectedID: 0 };

    default:
      return state;
  }
}

export default function OverviewContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedID, dispatch] = useReducer(selectedIDReducer, {
    selectedID: 0,
  });

  function handleSaveSelectedID(id: number) {
    dispatch({ type: "SAVE_SELECTED_ID", payload: id });
  }

  function handleRetrieveSelectedID() {
    dispatch({ type: "RETRIEVE_SELECTED_ID" });
    return { selectedID: selectedID.selectedID };
  }

  function handleClearSelectedID() {
    dispatch({ type: "CLEAR_SELECTED_ID" });
  }

  const ctxValue = {
    selectedID: selectedID.selectedID,

    saveSelectedID: handleSaveSelectedID,
    retrieveSelectedID: handleRetrieveSelectedID,
    clearSelectedID: handleClearSelectedID,
  };

  return (
    <SelectedIDContext.Provider value={ctxValue}>
      {children}
    </SelectedIDContext.Provider>
  );
}
