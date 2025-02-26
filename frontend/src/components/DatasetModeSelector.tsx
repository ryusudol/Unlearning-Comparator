import { Label } from "./UI/label";
import { RadioGroup, RadioGroupItem } from "./UI/radio-group";
import { TRAIN, TEST } from "../constants/common";

interface Props {
  dataset: string;
  onValueChange: (value: string) => void;
}

export default function DatasetModeSelector({ dataset, onValueChange }: Props) {
  const isTrainChecked = dataset === TRAIN;
  const isTestChecked = dataset === TEST;

  return (
    <div className="flex items-center relative right-1">
      <RadioGroup
        className="flex"
        defaultValue={TRAIN}
        onValueChange={onValueChange}
      >
        <div className="flex items-center space-x-0.5">
          <RadioGroupItem
            className="w-3 h-3"
            value={TRAIN}
            id={TRAIN}
            color="#4d4d4d"
            checked={isTrainChecked}
          />
          <Label className="text-sm font-light text-[#4d4d4d]" htmlFor={TRAIN}>
            Train
          </Label>
        </div>
        <div className="flex items-center space-x-0.5">
          <RadioGroupItem
            className="w-3 h-3"
            value={TEST}
            id={TEST}
            color="#4d4d4d"
            checked={isTestChecked}
          />
          <Label className="text-sm font-light text-[#4d4d4d]" htmlFor={TEST}>
            Test
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
