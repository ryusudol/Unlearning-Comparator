import { Image } from "../../types/privacy-attack";
import { CategoryType, TooltipData, TooltipPosition } from "./AttackAnalytics";
import { UNLEARN, RETRAIN, ENTROPY, Metric } from "../../views/PrivacyAttack";

interface TooltipProps {
  tooltipData: TooltipData;
  thresholdValue: number;
  isAboveThresholdUnlearn: boolean;
  metric: Metric;
  position: TooltipPosition;
  imageData?: Image;
  retrainData: Array<{ value: number }>;
  unlearnData: Array<{ value: number }>;
  onClose: () => void;
}

export default function Tooltip({
  tooltipData,
  thresholdValue,
  isAboveThresholdUnlearn,
  metric,
  position,
  imageData,
  retrainData,
  unlearnData,
  onClose,
}: TooltipProps) {
  const prediction = getPrediction(
    tooltipData.type,
    tooltipData.value,
    thresholdValue,
    isAboveThresholdUnlearn
  );

  const average = (arr: Array<{ value: number }>) => {
    if (arr.length === 0) return 0;
    return (arr.reduce((sum, d) => sum + d.value, 0) / arr.length).toFixed(3);
  };

  const avgRetrain = average(retrainData);
  const avgUnlearn = average(unlearnData);

  const isMetricEntropy = metric === ENTROPY;

  return (
    <div
      className="w-[450px] h-[274px] bg-white z-[1000] p-2.5 absolute border border-[#ccc] shadow-[0 0 10px rgba(0,0,0,0.2)]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="h-full flex">
        <div className="w-[180px]">
          {imageData ? (
            <img
              src={`data:image/png;base64,${imageData.base64}`}
              alt="detail"
              className="w-[180px] h-[180px]"
            />
          ) : (
            <div className="w-[180px] h-[180px] bg-[#eee] flex justify-center items-center">
              No Image
            </div>
          )}
          <div className="mt-2 text-sm">
            <div>Ground Truth: {tooltipData.type}</div>
            <div>Prediction: {prediction}</div>
          </div>
        </div>
        <div className="pl-5 text-sm flex-1">
          <h4>{isMetricEntropy ? "Entropy Info" : "Confidence Info"}</h4>
          <div className="mt-2.5">
            <div>Retrain Avg: {avgRetrain}</div>
            <div>Unlearn Avg: {avgUnlearn}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPrediction(
  type: CategoryType,
  value: number,
  threshold: number,
  isAboveThresholdUnlearn: boolean
) {
  if (isAboveThresholdUnlearn) {
    return type === RETRAIN
      ? value < threshold
        ? UNLEARN
        : RETRAIN
      : value > threshold
      ? UNLEARN
      : RETRAIN;
  } else {
    return type === RETRAIN
      ? value > threshold
        ? RETRAIN
        : UNLEARN
      : value < threshold
      ? UNLEARN
      : RETRAIN;
  }
}
