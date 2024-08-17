export interface Svgs {
  retrainingSvgs: string[];
  unlearningSvgs: string[];
}

export interface SvgsContextType extends Svgs {
  saveRetrainingSvgs: (svgs: string[]) => void;
  saveUnlearningSvgs: (svgs: string[]) => void;

  retrieveRetrainingSvgs: () => string[];
  retrieveUnlearningSvgs: () => string[];

  clearRetrainingSvgs: () => void;
  clearUnlearningSvgs: () => void;
}

export type Action =
  | { type: "SAVE_RETRAINED_SVGS"; payload: string[] }
  | { type: "SAVE_UNLEARNED_SVGS"; payload: string[] }
  | { type: "RETRIEVE_RETRAINED_SVGS" }
  | { type: "RETRIEVE_UNLEARNED_SVGS" }
  | { type: "CLEAR_RETRAINED_SVGS" }
  | { type: "CLEAR_UNLEARNED_SVGS" };
