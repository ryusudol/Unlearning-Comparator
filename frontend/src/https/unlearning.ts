import { ExperimentData } from "../types/data";
import { UnlearningConfigurationData } from "../types/settings";
import { API_URL } from "../constants/common";

export async function executeMethodUnlearning(
  runningConfig: UnlearningConfigurationData
) {
  const method = runningConfig.method;
  const data: Omit<UnlearningConfigurationData, "method"> = {
    forget_class: runningConfig.forget_class,
    epochs: runningConfig.epochs,
    learning_rate: runningConfig.learning_rate,
    batch_size: runningConfig.batch_size,
  };

  try {
    const response = await fetch(`${API_URL}/unlearn/${method}`, {
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
  forgetClass: number
) {
  try {
    const formData = new FormData();
    formData.append("weights_file", customFile);
    formData.append("forget_class", forgetClass.toString());

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

export async function fetchDataFile(
  forgetClass: number,
  id: string
): Promise<ExperimentData> {
  try {
    const response = await fetch(`${API_URL}/data/${forgetClass}/${id}`);

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch an unlearned data file:", error);

    if (error instanceof Error) {
      alert(`Failed to fetch an unlearned data file: ${error.message}`);
    } else {
      alert(
        "An unknown error occurred while fetching an unlearned data file . . ."
      );
    }

    throw error;
  }
}

export async function fetchAllExperimentsData(forgetClass: number) {
  try {
    const response = await fetch(`${API_URL}/data/${forgetClass}/all`);

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch all unlearned data file:", error);

    if (error instanceof Error) {
      alert(`Failed to fetch all unlearned data file: ${error.message}`);
    } else {
      alert(
        "An unknown error occurred while fetching all unlearned data file . . ."
      );
    }

    throw error;
  }
}
