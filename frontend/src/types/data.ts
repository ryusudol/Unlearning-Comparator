export type Dist = {
  [key: string]: number[];
};

type CKA = {
  layers: string[];
  train: {
    forget_class: number[][];
    other_classes: number[][];
  };
  test: {
    forget_class: number[][];
    other_classes: number[][];
  };
};

export type Point = [
  number,
  number,
  number,
  number,
  number,
  number,
  {
    [key: string]: number;
  }
];

export type ExperimentData = {
  id: string;
  fc: number;
  phase: string;
  init: string;
  method: string;
  epochs: number | string;
  BS: number | string;
  LR: number | string;
  UA: number | string;
  RA: number | string;
  TUA: number | string;
  TRA: number | string;
  RTE: number | string;
  accs: number[];
  label_dist: Dist;
  conf_dist: Dist;
  t_accs: number[];
  t_label_dist: Dist;
  t_conf_dist: Dist;
  cka: CKA;
  points: Point[];
};
