import { UnlearningConfigurationData } from "../types/settings";

const API_URL = "http://localhost:8000";

export async function fetchUnlearningResult() {
  try {
    const response = await fetch(`${API_URL}/unlearn/result`);

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch the result:", error);

    if (error instanceof Error) {
      alert(`Failed to fetch the result: ${error.message}`);
    } else {
      alert("An unknown error occurred while fetching the result . . .");
    }

    throw error;
  }
}

export async function executePredefinedUnlearning(
  configState: UnlearningConfigurationData
) {
  const method = configState.method;
  const end =
    method === "Fine-Tuning"
      ? "ft"
      : method === "Random-Label"
      ? "rl"
      : method === "Gradient-Ascent"
      ? "ga"
      : "retrain";
  let data: {
    epochs: number;
    batch_size: number;
    learning_rate: number;
    forget_class: string;
    weights_filename?: string;
  } = {
    epochs: configState.epochs,
    batch_size: configState.batch_size,
    learning_rate: configState.learning_rate,
    forget_class: configState.forget_class,
  };
  if (end !== "retrain") {
    data = {
      ...data,
      weights_filename: configState.trained_model,
    };
  }

  try {
    const response = await fetch(`${API_URL}/unlearn/${end}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Failed to unlearn with the predefined setting:", error);

    if (error instanceof Error) {
      alert(`Failed to unlearn with the predefined setting: ${error.message}`);
    } else {
      alert("An unknown error occurred while unlearning . . .");
    }

    throw error;
  }
}

export async function executeCustomUnlearning(
  customFile: File,
  forgetClass: string
) {
  try {
    const formData = new FormData();
    formData.append("weights_file", customFile);
    formData.append("forget_class", forgetClass);

    const response = await fetch(`${API_URL}/unlearn/custom`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Failed to unlearn with the custom file:", error);

    if (error instanceof Error) {
      alert(`Failed to unlearn with the custom file: ${error.message}`);
    } else {
      alert(
        "An unknown error occurred while executing custom unlearning . . ."
      );
    }

    throw error;
  }
}
