import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import RetrainingConfigContextProvider from "./store/retraining-config-context";
import UnlearningConfigContextProvider from "./store/unlearning-config-context";
import MetricsContextProvider from "./store/overview-context";
import SvgsContextProvider from "./store/svgs-context";
import BaselineContextProvider from "./store/baseline-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RetrainingConfigContextProvider>
      <UnlearningConfigContextProvider>
        <MetricsContextProvider>
          <SvgsContextProvider>
            <BaselineContextProvider>
              <App />
            </BaselineContextProvider>
          </SvgsContextProvider>
        </MetricsContextProvider>
      </UnlearningConfigContextProvider>
    </RetrainingConfigContextProvider>
  </React.StrictMode>
);
