interface Props {
  about: "BaselineComparison" | "ForgetClass";
}

export default function Indicator({ about }: Props) {
  const text =
    about === "BaselineComparison"
      ? "Select both Baseline and Comparison."
      : "Select the target forget class first.";

  return (
    <div className="w-full h-full flex justify-center items-center text-[15px] text-gray-500">
      {text}
    </div>
  );
}
