import React from "react";
import "./Title.css";

type PropsType = {
  title: string;
};

function Title({ title }: PropsType) {
  return <p className="title">{title}</p>;
}

export default Title;
