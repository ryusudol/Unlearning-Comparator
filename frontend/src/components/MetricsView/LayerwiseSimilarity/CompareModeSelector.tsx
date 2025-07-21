import { Tabs, TabsList, TabsTrigger } from "../../UI/tabs";
import {
  COMPARE_ORIGINAL,
  COMPARE_RETRAIN,
} from "../../../constants/layerWiseSimilarity";

interface Props {
  compareMode: string;
  onValueChange: (value: string) => void;
}

export default function CompareModeSelector({
  compareMode,
  onValueChange,
}: Props) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-[15px]">Compare Against:</span>
      <Tabs value={compareMode} onValueChange={onValueChange}>
        <TabsList className="h-7 bg-gray-100">
          <TabsTrigger
            value={COMPARE_ORIGINAL}
            className="text-xs px-2 py-1 data-[state=active]:bg-neutral-dark data-[state=active]:text-white"
          >
            Original
          </TabsTrigger>
          <TabsTrigger
            value={COMPARE_RETRAIN}
            className="text-xs px-2 py-1 data-[state=active]:bg-neutral-dark data-[state=active]:text-white"
          >
            Retrained
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
