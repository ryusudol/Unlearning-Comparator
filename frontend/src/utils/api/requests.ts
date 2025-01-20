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
    console.error("Failed to fetch unlearning status:", error);

    if (error instanceof Error) {
      alert(`Failed to fetch unlearning status: ${error.message}`);
    } else {
      alert("An unknown error occurred while fetching unlearning status . . .");
    }

    throw error;
  }
}

export async function cancelUnlearning() {
  try {
    const response = await fetch(`${API_URL}/unlearn/cancel`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Failed to cancel running:", error);

    if (error instanceof Error) {
      alert(`Failed to cancel running: ${error.message}`);
    } else {
      alert("An unknown error occurred while cancelling running . . .");
    }

    throw error;
  }
}
