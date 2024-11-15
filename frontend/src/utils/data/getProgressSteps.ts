import { UnlearningStatus } from "../../types/settings";

export const getProgressSteps = (
  status: UnlearningStatus,
  completedSteps: number[],
  activeStep: number,
  umapProgress: number,
  ckaProgress: number
) => [
  {
    step: 1,
    title: "Unlearn",
    description: `Method: **${
      status.method ? status.method : "-"
    }** | Epochs: **${
      !completedSteps.includes(1)
        ? "-"
        : status.current_epoch + "/" + status.total_epochs
    }**\nUnlearning Loss: **${
      completedSteps.includes(1) &&
      (status.current_epoch > 1 ||
        (status.total_epochs === 1 && completedSteps.includes(2)))
        ? status.current_unlearn_loss === 0
          ? 0
          : status.current_unlearn_loss.toFixed(3)
        : "-"
    }** | Unlearning Accuracy: **${
      completedSteps.includes(1) &&
      (status.current_epoch > 1 ||
        (status.total_epochs === 1 && completedSteps.includes(2)))
        ? status.current_unlearn_accuracy === 0
          ? 0
          : status.current_unlearn_accuracy.toFixed(3)
        : "-"
    }**`,
  },
  {
    step: 2,
    title: "Evaluate",
    description: `Training Loss: **${
      completedSteps.includes(3) ||
      (completedSteps.includes(2) && status.progress.includes("Test"))
        ? status.p_training_loss === 0
          ? 0
          : status.p_training_loss.toFixed(3)
        : "-"
    }** | Training Accuracy: **${
      completedSteps.includes(3) ||
      (completedSteps.includes(2) && status.progress.includes("Test"))
        ? status.p_training_accuracy === 0
          ? 0
          : status.p_training_accuracy.toFixed(3)
        : "-"
    }**\nTest Loss: **${
      completedSteps.includes(3)
        ? status.p_test_loss === 0
          ? 0
          : status.p_test_loss.toFixed(3)
        : "-"
    }** | Test Accuracy: **${
      completedSteps.includes(3)
        ? status.p_test_accuracy === 0
          ? 0
          : status.p_test_accuracy.toFixed(3)
        : "-"
    }**`,
  },
  {
    step: 3,
    title: "Analyze",
    description: `${
      (activeStep === 3 &&
        (status.progress.includes("UMAP") ||
          status.progress.includes("CKA"))) ||
      (completedSteps.includes(3) &&
        (status.progress === "Idle" || status.progress === "Unlearning"))
        ? `Computing UMAP Embedding... **${
            !status.progress.includes("UMAP") ? "100" : umapProgress
          }%**`
        : "Computing UMAP Embedding"
    }\n${
      (activeStep === 3 && status.progress.includes("CKA")) ||
      (completedSteps.includes(3) &&
        (status.progress === "Idle" || status.progress === "Unlearning"))
        ? `Calculating CKA Similarity... **${
            status.progress === "Idle" || status.progress === "Unlearning"
              ? "100"
              : ckaProgress
          }%**`
        : "Calculating CKA Similarity"
    }\n${
      completedSteps.includes(3) &&
      (status.progress === "Idle" || status.progress === "Unlearning")
        ? `Done! Experiment ID: **${status.recent_id}**`
        : ""
    }`,
  },
];
