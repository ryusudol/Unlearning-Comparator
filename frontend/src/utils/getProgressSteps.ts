import { UnlearningStatus } from "../types/settings";

export const getProgressSteps = (
  status: UnlearningStatus,
  isFirstRunning: boolean,
  activeStep: number,
  progress: string,
  umapProgress: number,
  ckaProgress: number
) => [
  {
    step: 1,
    title: "Unlearn",
    description: `Method: **${
      status.method ? status.method : "-"
    }** | Epochs: **${
      isFirstRunning ? "-" : status.current_epoch + "/" + status.total_epochs
    }**\nUnlearning Loss: **${
      status.current_unlearn_loss === 0
        ? "-"
        : status.current_unlearn_loss.toFixed(3)
    }** | Unlearning Accuracy: **${
      status.current_unlearn_accuracy === 0
        ? "-"
        : status.current_unlearn_accuracy
    }**`,
  },
  {
    step: 2,
    title: "Evaluate",
    description: `Training Loss: **${
      status.p_training_loss === 0 ? "-" : status.p_training_loss
    }** | Training Accuracy: **${
      status.p_training_accuracy === 0 ? "-" : status.p_training_accuracy
    }**\nTest Loss: **${
      status.p_test_loss === 0 ? "-" : status.p_test_loss
    }** | Test Accuracy: **${
      status.p_test_accuracy === 0 ? "-" : status.p_test_accuracy
    }**`,
  },
  {
    step: 3,
    title: "Analyze",
    description: `${
      (activeStep === 3 &&
        (progress.includes("UMAP") || progress.includes("CKA"))) ||
      (!isFirstRunning && progress === "Idle")
        ? `Computing UMAP Embedding... ${
            !progress.includes("UMAP") ? "100" : umapProgress
          }%`
        : "Computing UMAP Embedding"
    }\n${
      (activeStep === 3 && progress.includes("CKA")) ||
      (!isFirstRunning && progress === "Idle")
        ? `Calculating CKA Similarity... ${
            progress === "Idle" ? "100" : ckaProgress
          }%`
        : "Calculating CKA Similarity"
    }\n${
      !isFirstRunning && progress === "Idle"
        ? `Done! Experiment ID: ${status.recent_id}`
        : ""
    }`,
  },
];
