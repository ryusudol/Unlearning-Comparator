import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import SvgContextProvider from "./store/svg-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <SvgContextProvider>
      <App />
    </SvgContextProvider>
  </React.StrictMode>
);
