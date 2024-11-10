type Dist = {
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

type Point = [
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
  epochs: number;
  BS: number;
  LR: number;
  UA: number;
  RA: number;
  TUA: number;
  TRA: number;
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
