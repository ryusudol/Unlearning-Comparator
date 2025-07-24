import { API_URL } from "../../constants/common";
import { ExperimentData } from "../../types/data";
import { DatasetMode } from "../../types/common";

export async function fetchFileData(
  datasetMode: DatasetMode,
  forgetClass: number,
  fileName: string
): Promise<ExperimentData> {
  try {
    const response = await fetch(
      `${API_URL}/data/${datasetMode}/${forgetClass}/${fileName}`
    );

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

export async function fetchAllWeightNames(
  datasetMode: DatasetMode,
  forgetClass: number
) {
  try {
    const response = await fetch(
      `${API_URL}/data/${datasetMode}/${forgetClass}/all_weights_name`
    );

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch all weights names:", error);

    if (error instanceof Error) {
      console.error(`Failed to fetch all weights names: ${error.message}`);
    } else {
      console.error(
        "An unknown error occurred while fetching all weights names . . ."
      );
    }

    throw error;
  }
}
