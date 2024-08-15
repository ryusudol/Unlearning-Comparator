import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import SettingsContextProvider from "./store/unlearning-config-context";
import MetricsContextProvider from "./store/metrics-context";
import SvgsContextProvider from "./store/svgs-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <SettingsContextProvider>
      <MetricsContextProvider>
        <SvgsContextProvider>
          <App />
        </SvgsContextProvider>
      </MetricsContextProvider>
    </SettingsContextProvider>
  </React.StrictMode>
);
