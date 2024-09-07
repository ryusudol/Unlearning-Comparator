import { createContext, useReducer } from "react";

import {
  SelectedID,
  SelectedIDContextType,
  Action,
} from "../types/selected-id-context";

const SELECTED_ID = "selectedID";

export const SelectedIDContext = createContext<SelectedIDContextType>({
  selectedID: 0,

  saveSelectedID: (id: number) => {},
  retrieveSelectedID: () => {},
  clearSelectedID: () => {},
});

function selectedIDReducer(state: SelectedID, action: Action): SelectedID {
  switch (action.type) {
    case "SAVE_SELECTED_ID":
      const id = action.payload;
      sessionStorage.setItem(SELECTED_ID, JSON.stringify(id));
      return { selectedID: id };

    case "RETRIEVE_SELECTED_ID":
      const savedSelectedID = sessionStorage.getItem(SELECTED_ID);
      if (savedSelectedID) {
        const parsedSelectedID: SelectedID = JSON.parse(savedSelectedID);
        return { selectedID: parsedSelectedID.selectedID };
      }
      return state;

    case "CLEAR_SELECTED_ID":
      sessionStorage.removeItem(SELECTED_ID);
      return { selectedID: 0 };

    default:
      return state;
  }
}

export default function SelectedIDContextProvider({
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
