interface Props {
  mode: 0 | 1;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ConfigSelector({ mode, onClick }: Props) {
  return (
    <div className="h-7 text-center overflow-hidden flex border-[1px] border-[rgba(0, 0, 0, 0.2)] relative top-[1px] rounded-t-[6px]">
      <button
        id="0"
        onClick={onClick}
        className={`w-full relative pl-1.5 pr-2.5 text-sm font-[500] ${
          mode === 0 ? "bg-black text-white" : "bg-white text-[#030712]"
        }`}
      >
        <span>Training</span>
      </button>
      <button
        id="1"
        onClick={onClick}
        className={`w-full relative pl-3 pr-2.5 text-sm font-[500] before:-left-1 before:w-2 before:h-[13.5px] before:absolute before:block before:border-l-2 before:border-l-[#fff] before:top-0 before:transform before:skew-x-[20deg] after:absolute after:block after:border-l-2 after:border-l-[#fff] after:transform after:skew-x-[-20deg] after:-left-1 after:w-2 after:h-[14px] after:top-[13px] ${
          mode === 1 ? "bg-black text-white" : "bg-white text-[#030712]"
        } before:content-[''] before:bg-white after:content-[''] after:bg-white`}
      >
        <span>Unlearning</span>
      </button>
      <button
        id="2"
        onClick={onClick}
        className={`w-full relative pl-3 pr-1.5 text-sm font-[500] before:-left-1 before:w-2 before:h-[13.5px] before:absolute before:block before:border-l-2 before:border-l-[#fff] before:top-0 before:transform before:skew-x-[20deg] after:absolute after:block after:border-l-2 after:border-l-[#fff] after:transform after:skew-x-[-20deg] after:-left-1 after:w-2 after:h-[14px] after:top-[13px] ${
          mode === 1 ? "bg-black text-white" : "bg-white text-[#030712]"
        } before:content-[''] before:bg-white after:content-[''] after:bg-white`}
      >
        <span>Defense</span>
      </button>
    </div>
  );
}
