import { createSlice } from "@reduxjs/toolkit";

const RETRAINED_SVGS = "retrainedSvgs";
const UNLEARNED_SVGS = "unlearnedSvgs";

interface SvgsState {
  retrainedSvgs: string[];
  unlearnedSvgs: string[];
}

const initialSvgsState: SvgsState = {
  retrainedSvgs: [],
  unlearnedSvgs: [],
};

const svgsSlice = createSlice({
  name: "svgs",
  initialState: initialSvgsState,
  reducers: {
    saveRetrainedSvgs(state, action) {
      state.retrainedSvgs = action.payload;
      sessionStorage.setItem(
        RETRAINED_SVGS,
        JSON.stringify(state.retrainedSvgs)
      );
    },

    retrieveRetrainedSvgs(state) {
      const serializedSvgs = sessionStorage.getItem(RETRAINED_SVGS);
      if (!serializedSvgs) return;
      try {
        const parsedSvgs = JSON.parse(serializedSvgs);
        if (
          Array.isArray(parsedSvgs) &&
          parsedSvgs.length === 4 &&
          parsedSvgs.every((item: any) => typeof item === "string")
        ) {
          state.retrainedSvgs = parsedSvgs;
        } else {
          state.retrainedSvgs = [];
        }
      } catch (err) {
        console.error(err);
        state.retrainedSvgs = [];
      }
    },

    clearRetrainedSvgs(state) {
      sessionStorage.removeItem(RETRAINED_SVGS);
      state.retrainedSvgs = [];
    },

    saveUnlearnedSvgs(state, action) {
      state.unlearnedSvgs = action.payload;
      sessionStorage.setItem(
        UNLEARNED_SVGS,
        JSON.stringify(state.unlearnedSvgs)
      );
    },

    retrieveUnlearnedSvgs(state) {
      const serializedSvgs = sessionStorage.getItem(UNLEARNED_SVGS);
      if (!serializedSvgs) return;
      try {
        const parsedSvgs = JSON.parse(serializedSvgs);
        if (
          Array.isArray(parsedSvgs) &&
          parsedSvgs.length === 4 &&
          parsedSvgs.every((item: any) => typeof item === "string")
        ) {
          state.unlearnedSvgs = parsedSvgs;
        } else {
          state.unlearnedSvgs = [];
        }
      } catch (err) {
        console.error(err);
        state.unlearnedSvgs = [];
      }
    },

    clearUnlearnedSvgs(state) {
      sessionStorage.removeItem(UNLEARNED_SVGS);
      state.unlearnedSvgs = [];
    },
  },
});

export const svgsActions = svgsSlice.actions;

export default svgsSlice.reducer;
