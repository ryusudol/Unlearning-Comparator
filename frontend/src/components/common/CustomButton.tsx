import React from "react";

import { Button } from "../UI/button";
import { cn } from "../../utils/util";

interface Props
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: React.ReactNode;
  className?: string;
}

export default function CustomButton({ children, className, ...props }: Props) {
  return (
    <Button
      className={cn(
        `bg-[#585858] hover:bg-[#696969] h-[30px] text-base px-3`,
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
