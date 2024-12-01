import { Slider } from "./UI/slider";

interface Props {
  name: string;
  value: number[];
  setValue: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  displayValue?: number | string;
}

export default function MySlider({
  name,
  value,
  setValue,
  min,
  max,
  step,
  displayValue,
}: Props) {
  return (
    <div className="flex items-center">
      <Slider
        id={name}
        name={name}
        onValueChange={setValue}
        value={value}
        defaultValue={value}
        className="w-[194px] mx-2 cursor-pointer"
        min={min}
        max={max}
        step={step}
      />
      <span className="text-sm text-nowrap">{displayValue ?? value}</span>
    </div>
  );
}
