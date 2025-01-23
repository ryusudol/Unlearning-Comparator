import React from "react";

import { Button } from "./UI/button";

interface Props {
  content: string | React.ReactNode;
  onClick?: () => void;
  type?: "submit" | "reset" | "button" | undefined;
  className?: string;
}

export default function CustomButton({
  onClick,
  content,
  type,
  className,
}: Props) {
  return (
    <Button
      type={type ?? "submit"}
      className={`bg-[#585858] hover:bg-[#696969] h-7 ${className}`}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
