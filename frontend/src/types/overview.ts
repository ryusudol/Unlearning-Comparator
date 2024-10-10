export type Overview = {
  id: string;
  forget: number;
  phase: string;
  method: string;
  epochs: number | string;
  lr: number | string;
  batchSize: number | string;
  seed: number;
  ua: number;
  ra: number;
  tua: number;
  tra: number;
  rte: number | string;
};
