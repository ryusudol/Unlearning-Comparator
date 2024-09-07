export interface SelectedID {
  selectedID: number;
}

export interface SelectedIDContextType extends SelectedID {
  saveSelectedID: (id: number) => void;
  retrieveSelectedID: () => void;
  clearSelectedID: () => void;
}

export type Action =
  | { type: "SAVE_SELECTED_ID"; payload: number }
  | { type: "RETRIEVE_SELECTED_ID" }
  | { type: "CLEAR_SELECTED_ID" };
