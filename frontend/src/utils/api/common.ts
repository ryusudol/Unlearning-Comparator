import { API_URL } from "../../constants/common";
import { ExperimentData } from "../../types/data";

export async function fetchFileData(
  forgetClass: number,
  fileName: string
): Promise<ExperimentData> {
  try {
    const response = await fetch(`${API_URL}/data/${forgetClass}/${fileName}`);

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch an unlearned data file:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred.";

    throw new Error(`Failed to fetch an unlearned data file: ${errorMessage}`);
  }
}

export async function fetchAllWeightNames(forgetClass: number) {
  try {
    const response = await fetch(
      `${API_URL}/data/${forgetClass}/all_weights_name`
    );

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch all weights names:", error);

    if (error instanceof Error) {
      alert(`Failed to fetch all weights names: ${error.message}`);
    } else {
      alert("An unknown error occurred while fetching all weights names . . .");
    }

    throw error;
  }
}
