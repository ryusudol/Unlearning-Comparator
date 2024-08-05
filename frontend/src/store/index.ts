import { configureStore } from "@reduxjs/toolkit";

import svgsReducer from "./svgs";

const store = configureStore({
  reducer: { svgs: svgsReducer },
});

export default store;
