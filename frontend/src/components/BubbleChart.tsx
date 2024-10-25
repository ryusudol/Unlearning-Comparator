import { ModeType } from "./PredictionChart";

interface Props {
  mode: ModeType;
  id: string;
  isExpanded: boolean;
}

export default function BubbleChart({ mode, id, isExpanded }: Props) {
  const fontSize = isExpanded ? "16px" : "13px";

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center ml-4">
        <span className="text-[17px] text-nowrap">
          {mode} Model {id !== "" ? `(${id})` : ""}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <img
          src="/bubble.png"
          alt="bubble chart img"
          style={{
            height: isExpanded ? "420px" : "205px",
            marginRight: isExpanded ? "10px" : "0",
          }}
        />
        <span
          style={{ fontSize }}
          className="text-[11px] font-extralight -mt-[5px]"
        >
          Prediction
        </span>
      </div>
    </div>
  );
}
