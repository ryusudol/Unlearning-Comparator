import { useEffect, createContext, useReducer } from "react";

import { forgetClassNames } from "../constants/forgetClassNames";
import {
  Action,
  ForgetClass,
  ForgetClassContextType,
} from "../types/forget-class-context";

const FORGET_CLASS = "forgetClass";

export const ForgetClassContext = createContext<ForgetClassContextType>({
  forgetClass: 0,

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
        return { forgetClass: parsedForgetClass.forgetClass };
      }
      return state;

    case "CLEAR_FORGET_CLASS":
      sessionStorage.removeItem(FORGET_CLASS);
      return { forgetClass: 0 };

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
    forgetClass: 0,
  });

  function handleSaveForgetClass(forgetClass: string) {
    dispatch({
      type: "SAVE_FORGET_CLASS",
      payload: forgetClassNames.indexOf(forgetClass),
    });
  }

  function handleRetrieveForgetClass() {
    dispatch({ type: "RETRIEVE_FORGET_CLASS" });
  }

  function handleClearForgetClass() {
    dispatch({ type: "CLEAR_FORGET_CLASS" });
  }

  useEffect(() => {
    handleRetrieveForgetClass();
  }, []);

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
