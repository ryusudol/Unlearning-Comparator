import { Label } from "./UI/label";
import { RadioGroup, RadioGroupItem } from "./UI/radio-group";

const TRAINING = "training";
const TEST = "test";

interface Props {
  onValueChange: (value: string) => void;
}

export default function DatasetModeSelector({ onValueChange }: Props) {
  return (
    <div className="flex items-center mr-[25px]">
      <span className="text-xs font-light mr-2">Dataset:</span>
      <RadioGroup
        className="flex"
        defaultValue={TRAINING}
        onValueChange={onValueChange}
      >
        <div className="flex items-center space-x-[2px]">
          <RadioGroupItem value={TRAINING} id={TRAINING} />
          <Label className="text-xs font-light" htmlFor={TRAINING}>
            Training
          </Label>
        </div>
        <div className="flex items-center space-x-[2px]">
          <RadioGroupItem value={TEST} id={TEST} />
          <Label className="text-xs font-light" htmlFor={TEST}>
            Test
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
