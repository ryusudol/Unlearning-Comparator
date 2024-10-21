export interface ForgetClass {
  forgetClass: number;
}

export interface ForgetClassContextType extends ForgetClass {
  saveForgetClass: (forgetClass: string) => void;
  retrieveForgetClass: () => void;
  clearForgetClass: () => void;
}

export type Action =
  | { type: "SAVE_FORGET_CLASS"; payload: number }
  | { type: "RETRIEVE_FORGET_CLASS" }
  | { type: "CLEAR_FORGET_CLASS" };
