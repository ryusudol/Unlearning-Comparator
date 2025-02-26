import React from "react";

interface Props {
  title: string;
  id?: string;
  className?: string;
  AdditionalContent?: JSX.Element | false;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Title({
  title,
  id,
  className,
  AdditionalContent,
  onClick,
}: Props) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={
        "flex items-center gap-1 relative bottom-[1px] font-semibold text-xl leading-7 " +
        className
      }
    >
      <span>{title}</span>
      {AdditionalContent}
    </div>
  );
}
