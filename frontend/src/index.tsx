import React from "react";
import ReactDOM from "react-dom/client";

import "./app/index.css";
import App from "./app/App";
import RunningStatusContextProvider from "./stores/running-status-context";
import ForgetClassContextProvider from "./stores/forget-class-context";
import ExperimentsContextProvider from "./stores/experiments-context";
import RunningIndexContextProvider from "./stores/running-index-context";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RunningStatusContextProvider>
      <ForgetClassContextProvider>
        <ExperimentsContextProvider>
          <RunningIndexContextProvider>
            <App />
          </RunningIndexContextProvider>
        </ExperimentsContextProvider>
      </ForgetClassContextProvider>
    </RunningStatusContextProvider>
  </React.StrictMode>
);
