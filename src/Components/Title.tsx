import React from "react";
import "./Title.css";

type PropsType = {
  title: string;
};

export default function Title({ title }: PropsType) {
  return <p className="title">{title}</p>;
}
