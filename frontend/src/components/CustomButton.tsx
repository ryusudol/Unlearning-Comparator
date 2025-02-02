import React from "react";

import { Button } from "./UI/button";

interface Props
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: React.ReactNode;
  className?: string;
}

export default function CustomButton({ children, className, ...props }: Props) {
  return (
    <Button
      className={`bg-[#585858] hover:bg-[#696969] h-7 ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
