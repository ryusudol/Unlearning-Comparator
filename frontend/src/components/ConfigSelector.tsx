import { useContext } from "react";

import { RunningStatusContext } from "../store/running-status-context";

interface Props {
  mode: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigSelector({ mode, onClick }: Props) {
  const { isRunning } = useContext(RunningStatusContext);

  return (
    <div className="w-3/5 h-[20px] bg-[#f0f0f0] flex justify-between items-center rounded-[4px] mt-[3px] mb-[6px] border-[0.5px] border-solid border-[#aeaeae]">
      <button
        className={`h-full text-[#6a7280] text-[13px] px-1 relative border-none cursor-pointer inline-block ${
          mode === 0 &&
          "bg-white text-[#030712] rounded-tl-[4px] rounded-bl-[4px]"
        }`}
        onClick={onClick}
        id="0"
        disabled={isRunning}
      >
        Training
      </button>
      <button
        className={`h-full text-[#6a7280] text-[13px] px-1 relative border-none cursor-pointer inline-block ${
          mode === 1 && "bg-white text-[#030712]"
        }`}
        onClick={onClick}
        id="1"
        disabled={isRunning}
      >
        <span className="ml-[3px]">Unlearning</span>
      </button>
      <button
        className={`h-full text-[#6a7280] text-[13px] px-1 relative border-none cursor-pointer inline-block ${
          mode === 2 &&
          "bg-white text-[#030712] rounded-tr-[4px] rounded-br-[4px]"
        }`}
        onClick={onClick}
        id="2"
        disabled={isRunning}
      >
        <span className="ml-[3px]">Defense</span>
      </button>
    </div>
  );
}
