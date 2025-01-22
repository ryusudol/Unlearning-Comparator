import { useEffect, createContext, useReducer, useCallback } from "react";

import {
  Action,
  ForgetClass,
  ForgetClassContextType,
} from "../types/forget-class-context";
import { FORGET_CLASS_ACTIONS } from "../constants/actions";
import { FORGET_CLASS_NAMES } from "../constants/common";
import { FORGET_CLASS } from "../constants/storageKeys";

export const ForgetClassContext = createContext<ForgetClassContextType>({
  forgetClass: undefined,
  selectedForgetClasses: [],

  saveForgetClass: (forgetClass: string | undefined) => {},
  addSelectedForgetClass: (forgetClass: string) => {},
  retrieveForgetClassContextData: () => {},
  deleteSelectedForgetClass: (forgetClass: string) => {},
});

function BaselineReducer(state: ForgetClass, action: Action): ForgetClass {
  switch (action.type) {
    case FORGET_CLASS_ACTIONS.SAVE_FORGET_CLASS:
      const forgetClass = action.payload;
      sessionStorage.setItem(
        FORGET_CLASS,
        JSON.stringify({ ...state, forgetClass })
      );
      return { ...state, forgetClass };

    case FORGET_CLASS_ACTIONS.ADD_SELECTED_FORGET_CLASS:
      const target = action.payload;
      if (!state.selectedForgetClasses.includes(target)) {
        const selectedForgetClasses = [...state.selectedForgetClasses, target];
        sessionStorage.setItem(
          FORGET_CLASS,
          JSON.stringify({ ...state, selectedForgetClasses })
        );
        return { ...state, selectedForgetClasses };
      }
      return state;

    case FORGET_CLASS_ACTIONS.RETRIEVE_FORGET_CLASS_CONTEXT_DATA:
      const savedContext = sessionStorage.getItem(FORGET_CLASS);
      if (savedContext) {
        const parsedContext = JSON.parse(savedContext);
        return {
          forgetClass: parsedContext.forgetClass,
          selectedForgetClasses: parsedContext.selectedForgetClasses,
        };
      }
      return state;

    case FORGET_CLASS_ACTIONS.DELETE_SELECTED_FORGET_CLASS:
      const savedForgetClassContext = sessionStorage.getItem(FORGET_CLASS);
      if (savedForgetClassContext) {
        const parsedContext = JSON.parse(savedForgetClassContext);
        const originalSelectedForgetClasses =
          parsedContext.selectedForgetClasses as number[];
        const newSelectedForgetClasses = originalSelectedForgetClasses.filter(
          (item) => item !== action.payload
        );
        const newState = {
          ...state,
          selectedForgetClasses: newSelectedForgetClasses,
        };
        sessionStorage.setItem(FORGET_CLASS, JSON.stringify(newState));
        return newState;
      }
      return state;

    default:
      return state;
  }
}

export default function ForgetClassContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(BaselineReducer, {
    forgetClass: undefined,
    selectedForgetClasses: [],
  });

  const handleSaveForgetClass = useCallback(
    (forgetClass: string | undefined) => {
      dispatch({
        type: FORGET_CLASS_ACTIONS.SAVE_FORGET_CLASS,
        payload: forgetClass
          ? FORGET_CLASS_NAMES.indexOf(forgetClass)
          : undefined,
      });
    },
    []
  );

  const handleAddSelectedForgetClass = useCallback((forgetClass: string) => {
    dispatch({
      type: FORGET_CLASS_ACTIONS.ADD_SELECTED_FORGET_CLASS,
      payload: FORGET_CLASS_NAMES.indexOf(forgetClass),
    });
  }, []);

  const handleRetrieveForgetClassContextData = useCallback(() => {
    dispatch({ type: FORGET_CLASS_ACTIONS.RETRIEVE_FORGET_CLASS_CONTEXT_DATA });
  }, []);

  const handleDeleteSelectedForgetClass = useCallback((forgetClass: string) => {
    dispatch({
      type: FORGET_CLASS_ACTIONS.DELETE_SELECTED_FORGET_CLASS,
      payload: FORGET_CLASS_NAMES.indexOf(forgetClass),
    });
  }, []);

  useEffect(() => {
    handleRetrieveForgetClassContextData();
  }, [handleRetrieveForgetClassContextData]);

  const ctxValue: ForgetClassContextType = {
    forgetClass: state.forgetClass,
    selectedForgetClasses: state.selectedForgetClasses,

    saveForgetClass: handleSaveForgetClass,
    addSelectedForgetClass: handleAddSelectedForgetClass,
    retrieveForgetClassContextData: handleRetrieveForgetClassContextData,
    deleteSelectedForgetClass: handleDeleteSelectedForgetClass,
  };

  return (
    <ForgetClassContext.Provider value={ctxValue}>
      {children}
    </ForgetClassContext.Provider>
  );
}
