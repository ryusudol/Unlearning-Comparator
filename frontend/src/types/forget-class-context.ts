export interface ForgetClass {
  forgetClass: number | undefined;
  selectedForgetClasses: number[];
}

export interface ForgetClassContextType extends ForgetClass {
  saveForgetClass: (forgetClass: string | undefined) => void;
  addSelectedForgetClass: (forgetClass: string) => void;
  retrieveForgetClassContextData: () => void;
  deleteSelectedForgetClass: (forgetClass: string) => void;
}

export type Action =
  | { type: "SAVE_FORGET_CLASS"; payload: number | undefined }
  | { type: "ADD_SELECTED_FORGET_CLASS"; payload: number }
  | { type: "RETRIEVE_FORGET_CLASS_CONTEXT_DATA" }
  | { type: "DELETE_SELECTED_FORGET_CLASS"; payload: number };
