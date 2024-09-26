import { useContext } from "react";

import { RunningStatusContext } from "../store/running-status-context";

const commonStyle =
  "w-full relative pl-3 pr-4 leading-5 text-[13px] font-[500] before:left-[-8px] before:w-3 before:h-3 before:absolute before:block before:border-l-[3px] before:border-l-[#fff] before:top-0 before:transform before:skew-x-[30deg] after:absolute after:block after:border-l-[3px] after:border-l-[#fff] after:transform after:skew-x-[-30deg] after:left-[-8px] after:w-3 after:h-3 after:top-3";

interface Props {
  mode: 0 | 1 | 2;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigSelector({ mode, onClick }: Props) {
  const { isRunning } = useContext(RunningStatusContext);

  return (
    <div className="relative m-0 p-0 text-center w-3/4 overflow-hidden flex border-[1px] border-[rgba(0, 0, 0, 0.2)] top-[1px] rounded-t-[6px]">
      <button
        id="0"
        onClick={onClick}
        className={`${commonStyle} ${
          mode === 0 ? "bg-black text-white" : "bg-white text-[#030712]"
        }`}
      >
        <span>Training</span>
      </button>
      <button
        id="1"
        onClick={onClick}
        className={`${commonStyle} ${
          mode === 1 ? "bg-black text-white" : "bg-white text-[#030712]"
        } before:content-[''] before:bg-white after:content-[''] after:bg-white`}
      >
        <span>Unlearning</span>
      </button>
      <button
        id="2"
        onClick={onClick}
        className={`${commonStyle} ${
          mode === 2 ? "bg-black text-white" : "bg-white text-[#030712]"
        } before:content-[''] before:bg-white after:content-[''] after:bg-white`}
      >
        <span>Defense</span>
      </button>
    </div>

    // <div className="w-3/5 h-[20px] bg-[#f0f0f0] flex justify-between items-center rounded-[4px] mt-[3px] mb-[6px] border-[0.5px] border-solid border-[#aeaeae]">
    //   <button
    // className={`h-full text-[#6a7280] text-[13px] px-1 relative border-none cursor-pointer inline-block ${
    //   mode === 0 &&
    //   "bg-white text-[#030712] rounded-tl-[4px] rounded-bl-[4px]"
    // }`}
    // onClick={onClick}
    // id="0"
    // disabled={isRunning}
    //   >
    //     Training
    //   </button>
    //   <button
    //     className={`h-full text-[#6a7280] text-[13px] px-1 relative border-none cursor-pointer inline-block ${
    //       mode === 1 && "bg-white text-[#030712]"
    //     }`}
    //     onClick={onClick}
    //     id="1"
    //     disabled={isRunning}
    //   >
    //     <span className="ml-[3px]">Unlearning</span>
    //   </button>
    //   <button
    //     className={`h-full text-[#6a7280] text-[13px] px-1 relative border-none cursor-pointer inline-block ${
    //       mode === 2 &&
    //       "bg-white text-[#030712] rounded-tr-[4px] rounded-br-[4px]"
    //     }`}
    //     onClick={onClick}
    //     id="2"
    //     disabled={isRunning}
    //   >
    //     <span className="ml-[3px]">Defense</span>
    //   </button>
    // </div>
  );
}
