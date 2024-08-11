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
  const response = await fetch(`${API_URL}/${end}`);

  if (!response.ok) {
    alert("Failed to fetch models.");
    return;
  }

  const models = await response.json();

  return models;
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
  dispatch?: Dispatch
) {
  const isTraining = identifier === "train";
  const isInference = identifier === "inference";
  const isUnlearning = identifier === "unlearn";
  if (fetchedResult.current) return;
  try {
    const response = await fetch(`${API_URL}/${identifier}/status`);
    if (!response.ok) {
      console.error("Failed to fetch status");
      return;
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
      const resultResponse = await fetch(`${API_URL}/${identifier}/result`);
      if (!resultResponse.ok) {
        alert("Error occurred while fetching the result.");
        setOperationStatus(0);
        return;
      }
      setOperationStatus(0);
      if (!isInference) setStatus!(undefined);
      if (isTraining) {
        const models = await fetchModelFiles("trained_models");
        setModelFiles!(models);
      } else if (isUnlearning) {
        const data = await resultResponse.json();
        dispatch!(svgsActions.saveUnlearnedSvgs(data.svg_files));
        // const models = await fetchModelFiles("unlearned_models");
        // setModelFiles!(models);
      }
    }
  } catch (err) {
    setOperationStatus(0);
    console.error(err);
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
  if (operationStatus) {
    try {
      setIndicator("Cancelling . . .");
      const res = await fetch(`${API_URL}/${identifier}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        alert("Error occurred while cancelling.");
        return;
      }
      fetchedResult.current = true;
      setOperationStatus(0);
    } catch (err) {
      console.error(err);
      setOperationStatus(0);
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
        isTraining
          ? "Training . . ."
          : `Unlearning Class ${
              (configState as unknown as UnlearningStatus).forget_class
            } . . .`
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
        const res = await fetch(
          `${API_URL}/${isTraining ? "train" : `unlearn/${end}`}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (!res.ok) {
          alert("Failed to run.");
          setOperationStatus(0);
        }
      } catch (err) {
        console.log(err);
        setOperationStatus(0);
      }
    } else {
      // custom
      if (!customFile) {
        alert("Please upload a custom file.");
        return;
      }
      setOperationStatus(2);
      try {
        setIndicator(isTraining ? "Inferencing . . ." : "Unlearning . . .");
        const formData = new FormData();
        formData.append("weights_file", customFile);
        if (!isTraining) {
          formData.append(
            "forget_class",
            (configState as UnlearningConfigurationData).forget_class.toString()
          );
        }
        const res = await fetch(
          `${API_URL}/${isTraining ? "inference" : "unlearn/custom"}`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (!res.ok) {
          alert("Failed to run with the custom file.");
          setOperationStatus(0);
          return;
        }
      } catch (err) {
        console.error(err);
        setOperationStatus(0);
      }
    }
  }
}
