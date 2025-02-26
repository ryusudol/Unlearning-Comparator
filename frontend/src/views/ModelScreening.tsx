import Experiments from "./Experiments";
import Progress from "./Progress";
import { Separator } from "../components/UI/separator";

export default function ModelScreening() {
  return (
    <div className="flex items-center">
      <Experiments />
      <Separator orientation="vertical" className="h-[225px] w-[1px]" />
      <Progress />
    </div>
  );
}
