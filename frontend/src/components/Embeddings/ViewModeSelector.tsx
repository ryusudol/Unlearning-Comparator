import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";
import { ViewModeType } from "../../types/embeddings";
import { VIEW_MODES } from "../../constants/embeddings";

interface ViewModeSelectorProps {
  viewMode: ViewModeType;
  setViewMode: (val: ViewModeType) => void;
}

export default function ViewModeSelector({
  viewMode,
  setViewMode,
}: ViewModeSelectorProps) {
  const onValueChange = (value: ViewModeType) => setViewMode(value);

  return (
    <Select
      value={viewMode}
      defaultValue={VIEW_MODES[0]}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="w-36 h-6">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VIEW_MODES.map((viewMode, idx) => (
          <SelectItem key={idx} value={viewMode}>
            {viewMode}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
