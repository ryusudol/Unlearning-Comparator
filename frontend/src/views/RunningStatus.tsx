import { Chart01Icon } from "../components/UI/icons";

export default function RunningStatus({ height }: { height: number }) {
  return (
    <div
      style={{ height: `${height}px` }}
      className="w-[402px] p-1 relative border"
    >
      <div className="flex items-center">
        <Chart01Icon />
        <h5 className="font-semibold ml-1 text-lg">Running Status</h5>
      </div>
      <div></div>
    </div>
  );
}
