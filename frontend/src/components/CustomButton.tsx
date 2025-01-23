import React from "react";

import { Button } from "./UI/button";
import { COLORS } from "../constants/colors";

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
      className={`bg-[${COLORS.BUTTON_BG_COLOR}] hover:bg-[${COLORS.HOVERED_BUTTON_BG_COLOR}] h-7 ${className}`}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
