import Experiments from "./Experiments";
import Progress from "./Progress";
import { Separator } from "../components/UI/separator";

export default function ModelScreening() {
  return (
    <div className="flex items-center">
      <Progress />
      <Separator orientation="vertical" className="h-[236px] w-[1px]" />
      <Experiments />
    </div>
  );
}
