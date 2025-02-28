import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";
import { VIEW_MODES } from "../../constants/embeddings";

interface ViewModeSelectorProps {
  viewMode: string;
  setViewMode: (val: string) => void;
}

export default function ViewModeSelector({
  viewMode,
  setViewMode,
}: ViewModeSelectorProps) {
  const onValueChange = (value: string) => setViewMode(value);

  return (
    <Select
      value={viewMode}
      defaultValue={VIEW_MODES[0].label}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="w-36 h-6">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VIEW_MODES.map((viewMode, idx) => (
          <SelectItem key={idx} value={viewMode.label}>
            {viewMode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
