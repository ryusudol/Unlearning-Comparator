export interface State {
  retrainedSvgs: string[];
  unlearnedSvgs: string[];
}

export type Action =
  | { type: "SAVE_RETRAINED_SVGS"; payload: string[] }
  | { type: "RETRIEVE_RETRAINED_SVGS" }
  | { type: "CLEAR_RETRAINED_SVGS" }
  | { type: "SAVE_UNLEARNED_SVGS"; payload: string[] }
  | { type: "RETRIEVE_UNLEARNED_SVGS" }
  | { type: "CLEAR_UNLEARNED_SVGS" };

export interface SvgContextType {
  retrainedSvgs: string[];
  unlearnedSvgs: string[];
  saveRetrainedSvgs: (svgs: string[]) => void;
  retrieveRetrainedSvgs: () => string[];
  clearRetrainedSvgs: () => void;
  saveUnlearnedSvgs: (svgs: string[]) => void;
  retrieveUnlearnedSvgs: () => string[];
  clearUnlearnedSvgs: () => void;
}
