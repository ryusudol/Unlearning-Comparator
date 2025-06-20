import { Tabs, TabsList, TabsTrigger } from "../UI/tabs";

interface Props {
  compareMode: string;
  onValueChange: (value: string) => void;
}

export const COMPARE_ORIGINAL = "original";
export const COMPARE_RETRAIN = "retrain";

export default function CompareModeSelector({ compareMode, onValueChange }: Props) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-[15px]" style={{ color: "#000" }}>Compare Against:</span>
      <Tabs value={compareMode} onValueChange={onValueChange}>
        <TabsList className="h-7 bg-gray-100">
          <TabsTrigger 
            value={COMPARE_ORIGINAL} 
            className="text-xs px-2 py-1 data-[state=active]:bg-[#585858] data-[state=active]:text-white"
          >
            Original
          </TabsTrigger>
          <TabsTrigger 
            value={COMPARE_RETRAIN} 
            className="text-xs px-2 py-1 data-[state=active]:bg-[#585858] data-[state=active]:text-white"
          >
            Retrained
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}