import React from "react";

interface Props {
  title: string;
  id?: string;
  customClass?: string;
  AdditionalContent?: JSX.Element | false;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Title({
  title,
  id,
  customClass,
  AdditionalContent,
  onClick,
}: Props) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={
        "flex items-center gap-1 ml-1 relative bottom-[1px] font-semibold text-[17px] leading-7 " +
        customClass
      }
    >
      <span>{title}</span>
      {AdditionalContent}
    </div>
  );
}
