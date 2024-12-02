import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import OverviewContextProvider from "./store/overview-context";
import RunningStatusContextProvider from "./store/running-status-context";
import BaselineComparisonContextProvider from "./store/baseline-comparison-context";
import ForgetClassContextProvider from "./store/forget-class-context";
import ExperimentsContextProvider from "./store/experiments-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <OverviewContextProvider>
      <RunningStatusContextProvider>
        <BaselineComparisonContextProvider>
          <ForgetClassContextProvider>
            <ExperimentsContextProvider>
              <App />
            </ExperimentsContextProvider>
          </ForgetClassContextProvider>
        </BaselineComparisonContextProvider>
      </RunningStatusContextProvider>
    </OverviewContextProvider>
  </React.StrictMode>
);
