import React from "react";

interface Props {
  title: string;
  AdditionalContent?: JSX.Element | false;
}

export default function Subtitle({ title, AdditionalContent }: Props) {
  return (
    <div className="flex items-center gap-1 font-medium text-[17px] text-[#4d4d4d] mb-1">
      <span>{title}</span>
      {AdditionalContent}
    </div>
  );
}
