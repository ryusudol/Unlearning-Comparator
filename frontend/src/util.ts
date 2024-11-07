import { forgetClassNames } from "./constants/forgetClassNames";
import { TABLEAU10 } from "./constants/tableau10";
import { UnlearningStatus, DefenseStatus } from "./types/settings";

export function getAccuracies(
  selectedMode: "Test" | "Train",
  status: UnlearningStatus | DefenseStatus | undefined
) {
  let accuracies: number[] = [];

  if (selectedMode === "Test") {
    if (
      status &&
      (status as UnlearningStatus).test_class_accuracies &&
      !Array.isArray((status as UnlearningStatus).test_class_accuracies)
    ) {
      for (let key in (status as UnlearningStatus).test_class_accuracies)
        accuracies.push(
          (status as UnlearningStatus).test_class_accuracies![key]
        );
    }
  } else {
    if (
      status &&
      (status as UnlearningStatus).train_class_accuracies &&
      !Array.isArray((status as UnlearningStatus).train_class_accuracies)
    ) {
      for (let key in (status as UnlearningStatus).train_class_accuracies)
        accuracies.push(
          (status as UnlearningStatus).train_class_accuracies[key]
        );
    }
  }

  return { accuracies };
}

export function getDefaultUnlearningConfig(method: string) {
  let epochs, learning_rate;

  if (method === "ft") {
    epochs = 10;
    learning_rate = -2;
  } else if (method === "rl") {
    epochs = 3;
    learning_rate = -2;
  } else if (method === "ga") {
    epochs = 3;
    learning_rate = -4;
  } else {
    epochs = 30;
    learning_rate = -2;
  }

  return { epochs, learning_rate };
}

export const hexToRgba = (hex: string, opacity: number) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getPhaseColors = (
  phase: string,
  colorOpacity: number,
  backgroundColorOpacity: number
) => {
  let color, backgroundColor;
  if (phase === "Unlearning") {
    color = `rgba(255, 140, 0, ${colorOpacity})`;
    backgroundColor = `rgba(255, 140, 0, ${backgroundColorOpacity})`;
  } else if (phase === "Defended") {
    color = `rgba(34, 139, 34, ${colorOpacity})`;
    backgroundColor = `rgba(34, 139, 34, ${backgroundColorOpacity})`;
  } else if (phase === "Origin") {
    color = `rgba(80, 80, 80, ${colorOpacity})`;
    backgroundColor = `rgba(80, 80, 80, ${backgroundColorOpacity})`;
  } else {
    color = `rgba(218, 165, 32, ${colorOpacity})`;
    backgroundColor = `rgba(218, 165, 32, ${backgroundColorOpacity})`;
  }
  return { color, backgroundColor };
};

export function renderTooltip(
  xSize: number,
  ySize: number,
  imageUrl: string,
  d: (number | number[])[]
) {
  return `<div style="width: ${xSize}px; height: ${ySize}px; display: flex; justify-content: center; align-items: center;">
            <div style="margin: 8px 8px 0 0;">
              <div style="display: flex; justify-content: center;">
                <img src="${imageUrl}" alt="cifar-10 image" width="140" height="140" />
              </div>
              <div style="font-size: 14px; margin-top: 4px">
                <span style="font-weight: 500;">Ground Truth</span>: ${
                  forgetClassNames[d[2] as number]
                }
              </div>
              <div style="font-size: 14px;">
                <span style="font-weight: 500;">Prediction</span>: ${
                  forgetClassNames[d[3] as number]
                }
              </div>
            </div>
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: start; align-items: start;">
              <p style="font-weight: 600; margin-left: 20px;">Confidence:</p>
              <div>
                ${(d[6] as number[])
                  .map(
                    (value, idx) => `
                    <div style="width: 100%; display: grid; grid-template-columns: 65px 100px 40px;">
                      <span style="font-size: 14px; text-align: end; transform: rotate(-30deg); transform-origin: right;">${
                        forgetClassNames[idx]
                      }</span>
                      <div style="width: 100%; display: flex; justify-content: center; align-items: center;">
                        <progress
                          style="width: 80%; height: 2px; appearance: none;"
                          value=${Number(value.toFixed(3))}
                          min=${0}
                          max=${1}
                          id="progress-${idx}"
                        ></progress>
                      </div>
                      <span style="font-size: 14px">${value.toFixed(3)}</span>
                      <style>
                        #progress-${idx}::-webkit-progress-bar {
                          background-color: #f0f0f0;
                        }
                        #progress-${idx}::-webkit-progress-value {
                          background-color: ${TABLEAU10[idx]};
                        }
                      </style>
                    </div>
                  `
                  )
                  .join("")}
              </div>
            </div>
          </div>`;
}
