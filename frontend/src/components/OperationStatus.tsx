import { useState } from "react";

import ProgressBar from "../components/UI/ProgressBar";
import { getAccuracies } from "../util";
import {
  TrainingStatus,
  UnlearningStatus,
  DefenseStatus,
} from "../types/settings";

const MODES: Mode[] = ["Test", "Train"];
let prevETA: number, ETA: number | undefined;

type Mode = "Test" | "Train";
type Identifier = "training" | "unlearning" | "defense";
interface Props {
  identifier: Identifier;
  indicator: string;
  status: TrainingStatus | UnlearningStatus | DefenseStatus | undefined;
}

export default function OperationStatus({
  identifier,
  indicator,
  status,
}: Props) {
  const [selectedMode, setSelectedMode] = useState<Mode>(MODES[0]);

  const handleModeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMode(e.currentTarget.value as Mode);
  };

  const { isTraining, accuracies } = getAccuracies(
    selectedMode,
    identifier,
    status
  );

  if (status && status.estimated_time_remaining && status.current_epoch === 1) {
    prevETA = status.estimated_time_remaining;
    ETA = status.estimated_time_remaining;
  } else if (
    status &&
    status.estimated_time_remaining &&
    status.current_epoch > 1
  ) {
    ETA = prevETA;
  } else {
    ETA = undefined;
  }

  return (
    <div className="w-full h-[168px] flex justify-start items-start px-[3px]">
      <div className="flex flex-col justify-start items-start mr-12">
        <span className="text-red-600 text-[14px] font-[600] mt-[2px] mb-[6px]">
          {indicator}
        </span>
        {status && status.current_epoch >= 1 && (
          <div className="flex flex-col justify-start items-start ml-1">
            <span className="text-[12px] mb-[3px]">
              Epoch: {status.current_epoch}/{status.total_epochs}
            </span>
            <span className="text-[12px] mb-[3px]">
              Current Loss: {status.current_loss.toFixed(3)}
            </span>
            <span className="text-[12px] mb-[3px]">
              Current Accuracy: {status.current_accuracy.toFixed(3)}
            </span>
            {isTraining ? (
              <span className="text-[12px] mb-[3px]">
                Best Loss: {(status as TrainingStatus).best_loss.toFixed(3)}
              </span>
            ) : (
              <span className="text-[12px] mb-[3px]">
                Test Loss: {(status as UnlearningStatus).test_loss.toFixed(3)}
              </span>
            )}
            {isTraining ? (
              <span className="text-[12px] mb-[3px]">
                Best Accuracy:{" "}
                {(status as TrainingStatus).best_accuracy.toFixed(3)}
              </span>
            ) : (
              <span className="text-[12px] mb-[3px]">
                Test Accuracy:{" "}
                {(status as UnlearningStatus).test_accuracy.toFixed(3)}
              </span>
            )}
            <span className="text-[12px] mb-[3px]">
              ETA: {status.estimated_time_remaining!.toFixed(2)}s
            </span>
            <ProgressBar eta={ETA} />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-start items-start">
        <select
          className="w-20 h-5 border-[1px] border-solid border-[#c4c7cb] rounded-[3px] px-[2px] text-[13px] mb-[6px] focus:outline-none"
          onChange={handleModeSelection}
        >
          {MODES.map((mode, idx) => (
            <option key={idx} value={mode}>
              {mode}
            </option>
          ))}
        </select>
        <div className="flex flex-col justify-start">
          {accuracies.length !== 0 &&
            accuracies.map((acc, idx) => (
              <span className="text-[12px]" key={idx}>
                Class {idx}: {acc.toFixed(3)}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
