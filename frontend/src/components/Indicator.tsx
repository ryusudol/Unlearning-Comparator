interface Props {
  about?: "AB" | "ForgetClass";
  text?: string;
}

export default function Indicator({ about, text }: Props) {
  const content = text
    ? text
    : about === "AB"
    ? "Select both model A and model B."
    : "Select the target forget class first.";

  return (
    <div
      className={`${
        text ? "w-[628px]" : "w-full"
      } h-full flex justify-center items-center text-[15px] text-gray-500`}
    >
      {content}
    </div>
  );
}
