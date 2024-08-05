import { createSlice } from "@reduxjs/toolkit";

const ORIGINAL_SVGS = "originalSvgs";
const UNLEARNED_SVGS = "unlearnedSvgs";

interface SvgsState {
  originalSvgs: string[];
  unlearnedSvgs: string[];
}

const initialSvgsState: SvgsState = {
  originalSvgs: [],
  unlearnedSvgs: [],
};

const svgsSlice = createSlice({
  name: "svgs",
  initialState: initialSvgsState,
  reducers: {
    saveOriginalSvgs(state, action) {
      state.originalSvgs = action.payload;
      sessionStorage.setItem(ORIGINAL_SVGS, JSON.stringify(state.originalSvgs));
    },

    retrieveOriginalSvgs(state) {
      const serializedSvgs = sessionStorage.getItem(ORIGINAL_SVGS);
      if (!serializedSvgs) return;
      try {
        const parsedSvgs = JSON.parse(serializedSvgs);
        if (
          Array.isArray(parsedSvgs) &&
          parsedSvgs.length === 4 &&
          parsedSvgs.every((item: any) => typeof item === "string")
        ) {
          state.originalSvgs = parsedSvgs;
        } else {
          state.originalSvgs = [];
        }
      } catch (err) {
        console.error(err);
        state.originalSvgs = [];
      }
    },

    clearOriginalSvgs(state) {
      sessionStorage.removeItem(ORIGINAL_SVGS);
      state.originalSvgs = [];
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
