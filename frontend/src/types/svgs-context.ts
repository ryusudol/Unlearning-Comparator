export interface Svgs {
  retrainedSvgs: string[];
  unlearnedSvgs: string[];
}

export interface SvgsContextType extends Svgs {
  saveRetrainedSvgs: (svgs: string[]) => void;
  saveUnlearnedSvgs: (svgs: string[]) => void;

  retrieveRetrainedSvgs: () => string[];
  retrieveUnlearnedSvgs: () => string[];

  clearRetrainedSvgs: () => void;
  clearUnlearnedSvgs: () => void;
}

export type Action =
  | { type: "SAVE_RETRAINED_SVGS"; payload: string[] }
  | { type: "SAVE_UNLEARNED_SVGS"; payload: string[] }
  | { type: "RETRIEVE_RETRAINED_SVGS" }
  | { type: "RETRIEVE_UNLEARNED_SVGS" }
  | { type: "CLEAR_RETRAINED_SVGS" }
  | { type: "CLEAR_UNLEARNED_SVGS" };
