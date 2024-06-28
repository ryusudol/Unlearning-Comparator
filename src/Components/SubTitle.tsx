import React from "react";
import "./SubTitle.css";

type PropsType = {
  subtitle: string;
};

function SubTitle({ subtitle }: PropsType) {
  return <p className="subtitle">{subtitle}</p>;
}

export default SubTitle;
