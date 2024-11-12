import { cn } from "../../lib/utils";

interface StepperProps {
  className?: string;
  children: React.ReactNode;
}

const Stepper = ({ className, children, ...delegated }: StepperProps) => {
  return (
    <div className={cn("flex gap-2", className)} {...delegated}>
      {children}
    </div>
  );
};

const StepperItem = ({ className, children, ...delegated }: StepperProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 group data-[disabled]:pointer-events-none",
        className
      )}
      {...delegated}
    >
      {children}
    </div>
  );
};

const StepperTrigger = ({
  className,
  children,
  ...delegated
}: StepperProps) => {
  return (
    <button
      className={cn(
        "p-2 flex flex-col items-center text-center gap-2 rounded-md",
        className
      )}
      {...delegated}
    >
      {children}
    </button>
  );
};

const StepperSeparator = ({ className, ...delegated }: StepperProps) => {
  return (
    <div
      className={cn(
        "bg-muted",
        // Disabled
        "group-data-[disabled]:bg-muted group-data-[disabled]:opacity-50",
        // Completed
        "group-data-[state=completed]:bg-accent-foreground",
        className
      )}
      {...delegated}
    />
  );
};

const StepperTitle = ({ className, children, ...delegated }: StepperProps) => {
  return (
    <div
      className={cn("text-md font-semibold whitespace-nowrap", className)}
      {...delegated}
    >
      {children}
    </div>
  );
};

const StepperDescription = ({
  className,
  children,
  ...delegated
}: StepperProps) => {
  return (
    <div
      className={cn("text-xs text-muted-foreground", className)}
      {...delegated}
    >
      {children}
    </div>
  );
};

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperSeparator,
  StepperTitle,
  StepperDescription,
};
