import { TrainingConfigurationData } from "../types/settings";

const API_URL = "http://localhost:8000";

export async function executeTraining(configState: TrainingConfigurationData) {
  const data = {
    epochs: configState.epochs,
    batch_size: configState.batch_size,
    learning_rate: configState.learning_rate,
  };

  try {
    const response = await fetch(`${API_URL}/train`, {
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
    console.error("Failed to train with the predefined setting:", error);

    if (error instanceof Error) {
      alert(`Failed to train with the predefined setting: ${error.message}`);
    } else {
      alert("An unknown error occurred while training . . .");
    }

    throw error;
  }
}
