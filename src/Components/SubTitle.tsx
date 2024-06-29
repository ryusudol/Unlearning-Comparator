import React from "react";
import "./SubTitle.css";

type PropsType = {
  subtitle: string;
};

export default function SubTitle({ subtitle }: PropsType) {
  return <p className="subtitle">{subtitle}</p>;
}
