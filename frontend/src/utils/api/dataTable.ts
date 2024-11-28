import { API_URL } from "../../constants/common";

export async function deleteRow(forgetClass: number, fileName: string) {
  try {
    const response = await fetch(`${API_URL}/data/${forgetClass}/${fileName}`, {
      method: "DELETE",
    });

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

export async function downloadJSON(forgetClass: number, fileName: string) {
  try {
    const response = await fetch(`${API_URL}/data/${forgetClass}/${fileName}`);

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

export async function downloadPTH(forgetClass: number, fileName: string) {
  try {
    const response = await fetch(
      `${API_URL}/data/${forgetClass}/weights/${fileName}`
    );

    if (!response.ok) {
      throw new Error(
        `Status Code: ${response.status}, Message: ${response.statusText}`
      );
    }

    return await response.json();
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
