import { API_URL } from "../../constants/common";
import { UnlearningStatus } from "../../types/experiments";

export async function fetchModelFiles(
  end: "trained_models" | "unlearned_models"
) {
  try {
    const response = await fetch(`${API_URL}/${end}`);

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch model files (${end}):`, error);

    if (error instanceof Error) {
      alert(`Failed to fetch model files: ${error.message}`);
    } else {
      alert("An unknown Error occurred while fetching model files . . .");
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

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch unlearning status: ${error}`);
  }
}
