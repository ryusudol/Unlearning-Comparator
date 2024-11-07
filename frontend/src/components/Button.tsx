import React from "react";
import { Button } from "./UI/button";

interface Props {
  onClick: () => void;
  content: string | React.ReactNode;
  className?: string;
}

export default function MyButton({ onClick, content, className }: Props) {
  return (
    <Button
      className={`bg-[#585858] hover:bg-[#696969] h-7 ${className}`}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
