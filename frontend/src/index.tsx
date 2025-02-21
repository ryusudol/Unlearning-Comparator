import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import RunningStatusContextProvider from "./stores/running-status-context";
import BaselineComparisonContextProvider from "./stores/baseline-comparison-context";
import ForgetClassContextProvider from "./stores/forget-class-context";
import ExperimentsContextProvider from "./stores/experiments-context";
import DatasetAndModelContextProvider from "./stores/dataset-and-model-context";
import RunningIndexContextProvider from "./stores/running-index-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RunningStatusContextProvider>
      <BaselineComparisonContextProvider>
        <ForgetClassContextProvider>
          <ExperimentsContextProvider>
            <DatasetAndModelContextProvider>
              <RunningIndexContextProvider>
                <App />
              </RunningIndexContextProvider>
            </DatasetAndModelContextProvider>
          </ExperimentsContextProvider>
        </ForgetClassContextProvider>
      </BaselineComparisonContextProvider>
    </RunningStatusContextProvider>
  </React.StrictMode>
);
