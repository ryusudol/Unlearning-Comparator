import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import RunningStatusContextProvider from "./store/running-status-context";
import BaselineComparisonContextProvider from "./store/baseline-comparison-context";
import ForgetClassContextProvider from "./store/forget-class-context";
import ExperimentsContextProvider from "./store/experiments-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RunningStatusContextProvider>
      <BaselineComparisonContextProvider>
        <ForgetClassContextProvider>
          <ExperimentsContextProvider>
            <App />
          </ExperimentsContextProvider>
        </ForgetClassContextProvider>
      </BaselineComparisonContextProvider>
    </RunningStatusContextProvider>
  </React.StrictMode>
);
