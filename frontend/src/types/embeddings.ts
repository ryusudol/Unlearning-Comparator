export type Coordinate = { x: number; y: number };

export type Position = {
  from: Coordinate | null;
  to: Coordinate | null;
};

export type HoverInstance = {
  imgIdx: number;
  source: "A" | "B";
  modelAProb?: Prob;
  modelBProb?: Prob;
} | null;

export type ViewMode = {
  label: string;
  explanation: string;
  length: number;
};

export type Prob = { [key: string]: number };

export type SelectedData = (number | Prob)[][];

export type SvgElementsRefType = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  gMain: d3.Selection<SVGGElement, unknown, null, undefined> | null;
  gDot: d3.Selection<SVGGElement, unknown, null, undefined> | null;
  circles: d3.Selection<
    SVGCircleElement,
    (number | Prob)[],
    SVGGElement,
    undefined
  > | null;
  crosses: d3.Selection<
    SVGPathElement,
    (number | Prob)[],
    SVGGElement,
    undefined
  > | null;
};
