import React from "react";
import "./ContentBox.css";

type PropsType = {
  children: React.ReactNode;
  height: 20 | 25 | 40 | 45 | 50;
};

export default function ContentBox({ children, height }: PropsType) {
  const heightMode =
    height === 20
      ? "height-20"
      : height === 25
      ? "height-25"
      : height === 40
      ? "height-40"
      : height === 45
      ? "height-45"
      : "height-50";

  return <section id={heightMode}>{children}</section>;
}
