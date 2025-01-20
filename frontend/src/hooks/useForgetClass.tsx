import { useContext } from "react";

import { ForgetClassContext } from "../store/forget-class-context";

export const useForgetClass = () => {
  const { forgetClass } = useContext(ForgetClassContext);

  const forgetClassNumber = forgetClass as number;
  const forgetClassExist = forgetClass !== undefined;

  return {
    forgetClass,
    forgetClassNumber,
    forgetClassExist,
  };
};
