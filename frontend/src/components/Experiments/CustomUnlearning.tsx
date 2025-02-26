import React from "react";

import { Input } from "../UI/input";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  fileName: string;
}

export default function CustomUnlearning({ fileName, ...props }: Props) {
  return (
    <div className="w-full grid grid-cols-2 gap-y-2">
      <p className="text-nowrap mb-1">Upload File</p>
      <div className="relative">
        <Input
          type="file"
          name="custom_file"
          accept=".pth"
          className="h-[25px] py-0.5 px-[7px] opacity-0 absolute inset-0"
          {...props}
        />
        <div className="h-[25px] py-0.5 px-3 border rounded-md bg-background flex items-center">
          <span
            className={`mr-2 text-nowrap truncate ${fileName && "text-sm"}`}
          >
            {fileName ? fileName : "Choose File"}
          </span>
        </div>
      </div>
    </div>
  );
}
