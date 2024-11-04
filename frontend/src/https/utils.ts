import { API_URL } from "../constants/common";

type RunningMode = "train" | "inference" | "unlearn";

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

    // TODO: 개발 끝나면 아래 주석처리 제거할 것
    // if (error instanceof Error) {
    //   alert(`Failed to fetch model files: ${error.message}`);
    // } else {
    //   alert("An unknown Error occurred while fetching model files . . .");
    // }

    throw error;
  }
}

export async function fetchRunningStatus(runningMode: RunningMode) {
  try {
    const response = await fetch(`${API_URL}/${runningMode}/status`);

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch running status:", error);

    if (error instanceof Error) {
      // TODO: 개발 끝나고 아래 주석 해제
      // alert(
      //   `Failed to fetch running status (${runningMode}): ${error.message}`
      // );
    } else {
      alert("An unknown error occurred while fetching running status . . .");
    }

    throw error;
  }
}

export async function cancelRunning(
  identifier: "train" | "unlearn" | "defense"
) {
  if (window.confirm("Are you sure you want to cancel?")) {
    try {
      const response = await fetch(`${API_URL}/${identifier}/cancel`, {
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
}
