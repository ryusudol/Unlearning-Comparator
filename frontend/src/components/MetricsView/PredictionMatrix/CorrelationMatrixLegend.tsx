import * as d3 from "d3";

import { Arrow } from "../../UI/icons";

export default function PredictionMatrixLegend() {
  const colorScale = d3
    .scaleSequential((t) => d3.interpolateGreys(0.05 + 0.95 * t))
    .domain([0, 1]);
  const numStops = 10;
  const bubbleColorScale = Array.from({ length: numStops }, (_, i) =>
    colorScale(i / (numStops - 1))
  );
  const gradient = `linear-gradient(to right, ${bubbleColorScale.join(", ")})`;

  return (
    <div className="flex justify-center items-center gap-11 text-[#666666] mb-1">
      <div className="flex items-center relative left-[34px]">
        <RightArrowIcon />
        <div className="flex flex-col leading-4">
          <span className="text-xs">Row</span>
          <span>Proportion</span>
        </div>
        <RectangleIcon className="mx-1.5" />
        <div className="flex flex-col items-end leading-4">
          <span className="text-xs">Row</span>
          <span>Confidence</span>
        </div>
        <LeftArrowIcon />
      </div>

      <div className="flex flex-col items-center gap-y-1.5 relative top-0.5 left-4">
        <div className="relative top-2 w-[156px] h-3.5">
          <div className="w-full h-full" style={{ background: gradient }} />
          <div className="absolute -bottom-[3.5px] left-1">
            <span className="text-[10px] text-black">0</span>
          </div>
          <div className="absolute -bottom-[3.5px] right-1">
            <span className="text-[10px] text-white">1</span>
          </div>
        </div>
        <div className="flex items-center text-[11px]">
          <span className="text-base relative top-1 left-2">Low</span>
          <Arrow className="mx-[33px] relative top-1" />
          <span className="text-base relative top-1 right-2">High</span>
        </div>
      </div>
    </div>
  );
}

function RectangleIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="35"
      height="35"
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.25"
        y="0.25"
        width="34.5"
        height="34.5"
        fill="#808080"
        stroke="white"
        stroke-width="0.5"
      />
      <line
        x1="0.285663"
        y1="0.588543"
        x2="33.9734"
        y2="34.2763"
        stroke="white"
        stroke-width="0.5"
      />
    </svg>
  );
}

function RightArrowIcon() {
  return (
    <svg
      className="absolute left-8 top-7"
      width="51"
      height="18"
      viewBox="0 0 51 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.638278 7.7551L12.0152 5.78077L8.03658 16.6207L0.638278 7.7551ZM50.2693 2.13884C40.5943 13.7904 32.3344 17.7611 25.2677 17.9246C18.2512 18.0869 12.6936 14.4714 8.52946 11.6868L9.64123 10.0242C13.8373 12.8303 18.9095 16.0711 25.2215 15.9251C31.4833 15.7802 39.2506 12.2778 48.7307 0.861163L50.2693 2.13884Z"
        fill="black"
        fill-opacity="0.5"
      />
    </svg>
  );
}

function LeftArrowIcon() {
  return (
    <svg
      className="absolute right-10 bottom-5"
      width="47"
      height="15"
      viewBox="0 0 47 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M46.0979 14.0036L34.627 12.6799L41.5088 3.40765L46.0979 14.0036ZM0.343022 13.2496C11.9721 3.11568 20.2958 -0.124575 26.5694 0.234259C32.8909 0.59583 36.8133 4.594 39.6411 8.0017L38.1021 9.2789C35.3329 5.94191 31.8867 2.54166 26.4552 2.231C20.976 1.9176 13.1624 4.7313 1.65698 14.7574L0.343022 13.2496Z"
        fill="black"
        fill-opacity="0.5"
      />
    </svg>
  );
}
