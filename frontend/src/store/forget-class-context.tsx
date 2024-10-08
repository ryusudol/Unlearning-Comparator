import { createContext, useReducer } from "react";

import {
  Action,
  ForgetClass,
  ForgetClassContextType,
} from "../types/forget-class-context";

const FORGET_CLASS = "forgetClass";

export const ForgetClassContext = createContext<ForgetClassContextType>({
  forgetClass: undefined,

  saveForgetClass: (forgetClass: string) => {},
  retrieveForgetClass: () => {},
  clearForgetClass: () => {},
});

function BaselineReducer(state: ForgetClass, action: Action): ForgetClass {
  switch (action.type) {
    case "SAVE_FORGET_CLASS":
      const forgetClass = action.payload;
      sessionStorage.setItem(FORGET_CLASS, JSON.stringify({ forgetClass }));
      return { forgetClass };

    case "RETRIEVE_FORGET_CLASS":
      const savedForgetClass = sessionStorage.getItem(FORGET_CLASS);
      if (savedForgetClass) {
        const parsedForgetClass = JSON.parse(savedForgetClass);
        return { forgetClass: parsedForgetClass };
      }
      return state;

    case "CLEAR_FORGET_CLASS":
      sessionStorage.removeItem(FORGET_CLASS);
      return { forgetClass: undefined };

    default:
      return state;
  }
}

export default function ForgetClassContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [forgetClass, dispatch] = useReducer(BaselineReducer, {
    forgetClass: undefined,
  });

  function handleSaveForgetClass(baseline: string) {
    dispatch({ type: "SAVE_FORGET_CLASS", payload: baseline });
  }

  function handleRetrieveForgetClass() {
    dispatch({ type: "RETRIEVE_FORGET_CLASS" });
  }

  function handleClearForgetClass() {
    dispatch({ type: "CLEAR_FORGET_CLASS" });
  }

  const ctxValue: ForgetClassContextType = {
    forgetClass: forgetClass.forgetClass,

    saveForgetClass: handleSaveForgetClass,
    retrieveForgetClass: handleRetrieveForgetClass,
    clearForgetClass: handleClearForgetClass,
  };

  return (
    <ForgetClassContext.Provider value={ctxValue}>
      {children}
    </ForgetClassContext.Provider>
  );
}
