import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import OverviewContextProvider from "./store/overview-context";
import BaselineContextProvider from "./store/baseline-comparison-context";
import RunningStatusContextProvider from "./store/running-status-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <OverviewContextProvider>
      <BaselineContextProvider>
        <RunningStatusContextProvider>
          <App />
        </RunningStatusContextProvider>
      </BaselineContextProvider>
    </OverviewContextProvider>
  </React.StrictMode>
);
