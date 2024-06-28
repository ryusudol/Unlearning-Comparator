import React from "react";
import "./Button.css";

type PropsType = {
  buttonText: string;
};

function Button({ buttonText }: PropsType) {
  return <div className="button-wrapper">{buttonText}</div>;
}

export default Button;
