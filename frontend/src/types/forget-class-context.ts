export interface ForgetClass {
  forgetClass: string;
}

export interface ForgetClassContextType extends ForgetClass {
  saveForgetClass: (baseline: string) => void;
  retrieveForgetClass: () => void;
  clearForgetClass: () => void;
}

export type Action =
  | { type: "SAVE_FORGET_CLASS"; payload: string }
  | { type: "RETRIEVE_FORGET_CLASS" }
  | { type: "CLEAR_FORGET_CLASS" };
