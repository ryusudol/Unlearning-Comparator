import { API_URL } from "../../constants/common";

export async function fetchAllSubsetImages(forgetClass: number) {
  try {
    const response = await fetch(`${API_URL}/image/all_subset/${forgetClass}`);

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`fetchAllSubsetImages failed: ${error.message}`);
    } else {
      throw new Error(`fetchAllSubsetImages failed: Unknown error`);
    }
  }
}
