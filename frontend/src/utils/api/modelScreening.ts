import { API_URL } from "../../constants/common";
import { DatasetMode } from "../../types/common";
import {
  UnlearningConfigurationData,
  UnlearningStatus,
} from "../../types/experiments";

export async function deleteRow(
  datasetMode: DatasetMode,
  forgetClass: number,
  fileName: string
) {
  try {
    const response = await fetch(
      `${API_URL}/data/${datasetMode}/${forgetClass}/${fileName}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Failed to delete the row:", error);

    if (error instanceof Error) {
      alert(`Failed to delete the row: ${error.message}`);
    } else {
      alert("An unknown error occurred while deleting the row . . .");
    }

    throw error;
  }
}

export async function downloadJSON(
  datasetMode: DatasetMode,
  forgetClass: number,
  fileName: string
) {
  try {
    const response = await fetch(
      `${API_URL}/data/${datasetMode}/${forgetClass}/${fileName}`
    );

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to download the JSON file:", error);

    if (error instanceof Error) {
      alert(`Failed to download the JSON file: ${error.message}`);
    } else {
      alert("An unknown error occurred while downloading the JSON file . . .");
    }

    throw error;
  }
}

export async function downloadPTH(
  datasetMode: DatasetMode,
  forgetClass: number,
  fileName: string
) {
  const fetchUrl = fileName.startsWith("000")
    ? `${API_URL}/trained_models`
    : `${API_URL}/data/${datasetMode}/${forgetClass}/${fileName}/weights`;

  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${fileName}.pth`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);

    return blob;
  } catch (error) {
    console.error("Failed to download the PTH file:", error);

    if (error instanceof Error) {
      alert(`Failed to download the PTH file: ${error.message}`);
    } else {
      alert("An unknown error occurred while downloading the PTH file . . .");
    }

    throw error;
  }
}

export async function fetchUnlearningStatus(): Promise<UnlearningStatus> {
  try {
    const response = await fetch(`${API_URL}/unlearn/status`);

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.method) {
      data.method = data.method.replace(/-/g, "");
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch unlearning status: ${error}`);
  }
}

export async function executeMethodUnlearning(
  datasetMode: DatasetMode,
  runningConfig: UnlearningConfigurationData
) {
  const method = runningConfig.method;
  const data: Omit<UnlearningConfigurationData, "method"> = {
    forget_class: runningConfig.forget_class,
    epochs: runningConfig.epochs,
    learning_rate: runningConfig.learning_rate,
    batch_size: runningConfig.batch_size,
    base_weights: runningConfig.base_weights,
  };

  try {
    const response = await fetch(
      `${API_URL}/unlearn/${datasetMode}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

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
  forgetClass: number,
  dataset: DatasetMode
) {
  try {
    const formData = new FormData();
    formData.append("weights_file", customFile);
    formData.append("forget_class", forgetClass.toString());

    const response = await fetch(`${API_URL}/unlearn/${dataset}/custom`, {
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

export async function fetchAllExperimentsData(
  dataset: DatasetMode,
  forgetClass: number
) {
  try {
    const response = await fetch(
      `${API_URL}/data/${dataset}/${forgetClass}/all`
    );

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
