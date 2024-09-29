import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

export default function ToggleGroup() {
  return (
    <div>
      <div className="flex items-center space-x-2 relative top-7 left-[220px]">
        <span className="text-[13px] font-light mr-2">Forgetting:</span>
        <div className="flex items-center">
          <Switch id="forget-data" className="mr-[5px]" />
          <Label htmlFor="forget-data" className="text-[13px] font-light">
            Data
          </Label>
        </div>
        <div className="flex items-center">
          <Switch id="forget-class" className="mr-[5px]" />
          <Label htmlFor="forget-class" className="text-[13px] font-light">
            Class
          </Label>
        </div>
      </div>
      <div className="flex space-x-2 relative top-7 left-[220px]">
        <span className="text-[13px] font-light mr-[6px]">Remaining:</span>
        <div className="flex items-center">
          <Switch id="remaining-data" className="mr-[5px]" />
          <Label htmlFor="remaining-data" className="text-[13px] font-light">
            Data
          </Label>
        </div>
        <div className="flex items-center">
          <Switch id="remaining-class" className="mr-[5px]" />
          <Label htmlFor="remaining-class" className="text-[13px] font-light">
            Class
          </Label>
        </div>
      </div>
    </div>
  );
}
