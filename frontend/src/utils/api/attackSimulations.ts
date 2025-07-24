import { API_URL } from "../../constants/common";

export async function fetchCifar10SubsetImages(forgetClass: number) {
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

export async function fetchFaceSubsetImages(forgetClass: number) {
  try {
    const response = await fetch(`${API_URL}/image/face_subset/${forgetClass}`);

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
