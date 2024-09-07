import React from "react";

type PropsType = {
  children?: React.ReactNode;
  height: number;
};

export default function ContentBox({ children, height }: PropsType) {
  return (
    <div
      className="relative p-[6px] flex flex-col justify-start items-start border-[1px] border-solid border-[rgba(0, 0, 0, 0.2)]"
      style={{ height: `${height}px` }}
    >
      {children}
    </div>
  );
}
