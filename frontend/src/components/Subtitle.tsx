import { cn } from "../utils/util";

interface Props {
  title: string;
  AdditionalContent?: JSX.Element | false;
  className?: string;
}

export default function Subtitle({
  title,
  AdditionalContent,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 font-medium text-lg text-[#4d4d4d] mb-1 relative",
        className
      )}
    >
      <span>{title}</span>
      {AdditionalContent}
    </div>
  );
}
