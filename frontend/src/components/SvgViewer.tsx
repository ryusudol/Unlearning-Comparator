import baseData from "../constants/base-scatter.json";

interface Props {
  mode: 0 | 1;
  svg: string | undefined;
}

export default function SvgViewer({ mode, svg }: Props) {
  return (
    <div className="w-[630px] h-[668px] flex flex-col justify-center items-center">
      <img
        src={mode === 0 ? "/embedding1.png" : "/embedding2.png"}
        alt="embedding img"
      />
    </div>
  );
}
