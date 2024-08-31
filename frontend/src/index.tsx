import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import OverviewContextProvider from "./store/overview-context";
import BaselineContextProvider from "./store/baseline-context";
import RunningStatusContextProvider from "./store/running-status-context";
import SelectedIDContextProvider from "./store/selected-id-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <SelectedIDContextProvider>
      <OverviewContextProvider>
        <BaselineContextProvider>
          <RunningStatusContextProvider>
            <App />
          </RunningStatusContextProvider>
        </BaselineContextProvider>
      </OverviewContextProvider>
    </SelectedIDContextProvider>
  </React.StrictMode>
);
