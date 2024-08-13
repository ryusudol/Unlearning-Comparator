import React from "react";

import { svgsActions } from "./store/svgs";
import { Dispatch } from "@reduxjs/toolkit";
import {
  TrainingConfigurationData,
  UnlearningConfigurationData,
  TrainingStatus,
  UnlearningStatus,
  Timer,
} from "./types/settings";

const API_URL = "http://localhost:8000";

export async function fetchModelFiles(end: string) {
  try {
    const response = await fetch(`${API_URL}/${end}`);

    if (!response.ok) {
      alert("Failed to fetch model files.");
      throw new Error(
        `Failed to fetch model files. HTTP status: ${response.status}`
      );
    }

    const models = await response.json();
    return models;
  } catch (error) {
    console.error("fetchModelFiles error: ", error);
    throw error;
  }
}

export async function monitorStatus(
  identifier: "train" | "inference" | "unlearn",
  fetchedResult: React.MutableRefObject<boolean>,
  interval: React.MutableRefObject<Timer>,
  setOperationStatus: (status: number) => void,
  setIndicator: (msg: string) => void,
  setStatus:
    | ((data: TrainingStatus | undefined) => void)
    | ((data: UnlearningStatus | undefined) => void),
  setModelFiles?: (files: string[]) => void,
  dispatch?: Dispatch,
  isRetrain?: boolean
) {
  const isTraining = identifier === "train";
  const isInference = identifier === "inference";
  const isUnlearning = identifier === "unlearn";

  if (fetchedResult.current) return;

  try {
    const response = await fetch(`${API_URL}/${identifier}/status`);

    if (!response.ok) {
      alert(`Failed to fetch ${identifier} status.`);
      throw new Error(
        `Failed to fetch ${identifier} status. HTTP status: ${response.status}`
      );
    }

    const data = await response.json();

    if (!isInference) setStatus!(data);

    if (
      data.progress === 100 &&
      (!data.is_training || !data.is_inferencing || !data.is_unlearning) &&
      !fetchedResult.current
    ) {
      setIndicator("Embedding . . .");

      fetchedResult.current = true;

      if (interval.current) {
        clearInterval(interval.current);
        interval.current = undefined;
      }

      const response = await fetch(`${API_URL}/${identifier}/result`);

      setOperationStatus(0);

      if (!response.ok) {
        alert("Error occurred while fetching the result.");
        throw new Error(
          `Failed to fetch ${identifier} result. HTTP status: ${response.status}`
        );
      }

      if (!isInference) setStatus!(undefined);

      if (isTraining) {
        const models = await fetchModelFiles("trained_models");
        setModelFiles!(models);
      } else if (isUnlearning) {
        const data = await response.json();
        if (isRetrain) dispatch!(svgsActions.saveRetrainedSvgs(data.svg_files));
        else dispatch!(svgsActions.saveUnlearnedSvgs(data.svg_files));
        // const models = await fetchModelFiles("unlearned_models");
        // setModelFiles!(models);
      }
    }
  } catch (error) {
    setOperationStatus(0);
    console.error("monitorStatus error: ", error);
    throw error;
  }
}

export async function execute(
  identifier: "train" | "unlearn",
  fetchedResult: React.MutableRefObject<boolean>,
  operationStatus: number,
  setOperationStatus: (status: number) => void,
  setIndicator: (msg: string) => void,
  mode: number,
  configState: TrainingConfigurationData | UnlearningConfigurationData,
  setStatus:
    | ((data: TrainingStatus | undefined) => void)
    | ((data: UnlearningStatus | undefined) => void),
  customFile: File | undefined
) {
  fetchedResult.current = false;

  const isTraining = identifier === "train";
  const forgetClass =
    "forget_class" in configState ? configState.forget_class : undefined;

  if (operationStatus) {
    // cancel
    if (window.confirm("Are you sure you want to cancel?")) {
      try {
        setIndicator("Cancelling . . .");

        const response = await fetch(`${API_URL}/${identifier}/cancel`, {
          method: "POST",
        });

        setOperationStatus(0);

        if (!response.ok) {
          alert(`Failed to cancel running.`);
          throw new Error(
            `Failed to cancel running. HTTP status: ${response.status}`
          );
        }
      } catch (error) {
        console.error("execute of cancelling error: ", error);
        throw error;
      }
    }
  } else {
    if (mode === 0) {
      // predefined
      if (
        (isTraining && (configState as TrainingConfigurationData).seed === 0) ||
        configState.epochs === 0 ||
        configState.batch_size === 0 ||
        configState.learning_rate === 0
      ) {
        alert("Please enter valid numbers");
        return;
      }

      setOperationStatus(1);
      setStatus(undefined);
      setIndicator(
        isTraining ? "Training . . ." : `Unlearning Class ${forgetClass} . . .`
      );

      try {
        const method = (configState as UnlearningConfigurationData).method;
        const end =
          method === "Fine-Tuning"
            ? "ft"
            : method === "Random-Label"
            ? "rl"
            : method === "Gradient-Ascent"
            ? "ga"
            : "retrain";
        const data = isTraining
          ? {
              seed: (configState as TrainingConfigurationData).seed,
              epochs: configState.epochs,
              batch_size: configState.batch_size,
              learning_rate: configState.learning_rate,
            }
          : {
              epochs: configState.epochs,
              batch_size: configState.batch_size,
              learning_rate: configState.learning_rate,
              forget_class: (configState as UnlearningConfigurationData)
                .forget_class,
            };

        const response = await fetch(
          `${API_URL}/${isTraining ? "train" : `unlearn/${end}`}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          alert(`Failed to ${identifier}.`);
          throw new Error(
            `Failed to ${identifier} with the predefined settings. HTTP status: ${response.status}`
          );
        }
      } catch (error) {
        setOperationStatus(0);
        console.error("execute of predefined running error: ", error);
        throw error;
      }
    } else {
      // custom
      if (!customFile) {
        alert("Please upload a custom file.");
        return;
      }

      setOperationStatus(2);
      setStatus(undefined);
      setIndicator(
        isTraining
          ? "Inferencing . . ."
          : `Unlearning Class ${forgetClass} . . .`
      );

      try {
        const formData = new FormData();
        formData.append("weights_file", customFile);
        if (!isTraining) {
          formData.append(
            "forget_class",
            (configState as UnlearningConfigurationData).forget_class.toString()
          );
        }

        const response = await fetch(
          `${API_URL}/${isTraining ? "inference" : "unlearn/custom"}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          alert(`Failed to ${identifier} with the custom file.`);
          throw new Error(
            `Failed to ${identifier}. HTTP status: ${response.status}`
          );
        }
      } catch (error) {
        setOperationStatus(0);
        console.error("execute of custom running error: ", error);
        throw error;
      }
    }
  }
}
