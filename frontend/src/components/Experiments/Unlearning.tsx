import React, { useContext, useState, useEffect } from "react";

import CustomUnlearning from "./CustomUnlearning";
import MethodUnlearning from "./MethodUnlearning";
import Button from "../CustomButton";
import {
  executeMethodUnlearning,
  executeCustomUnlearning,
  fetchFileData,
  fetchAllWeightNames,
} from "../../utils/api/unlearning";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/select";
import {
  getCurrentProgress,
  getCompletedSteps,
} from "../../utils/data/running-status-context";
import {
  UNLEARNING_METHODS,
  EPOCHS,
  BATCH_SIZE,
  LEARNING_RATE,
} from "../../constants/experiments";
import { Label } from "../UI/label";
import { useForgetClass } from "../../hooks/useForgetClass";
import { EraserIcon, PlusIcon, FlagIcon } from "../UI/icons";
import { RunningStatusContext } from "../../store/running-status-context";
import { BaselineComparisonContext } from "../../store/baseline-comparison-context";
import { ExperimentsContext } from "../../store/experiments-context";
import { UnlearningConfigurationData } from "../../types/experiments";
import { ExperimentData } from "../../types/data";
import { fetchUnlearningStatus } from "../../utils/api/requests";

const CUSTOM = "custom";
let initialExperiment: ExperimentData = {
  id: "",
  fc: -1,
  phase: "Unlearned",
  init: "",
  method: "",
  epochs: 0,
  BS: 0,
  LR: 0,
  UA: "-",
  RA: "-",
  TUA: "-",
  TRA: "-",
  RTE: "-",
  accs: [],
  label_dist: {},
  conf_dist: {},
  t_accs: [],
  t_label_dist: {},
  t_conf_dist: {},
  cka: {
    layers: [],
    train: {
      forget_class: [],
      other_classes: [],
    },
    test: {
      forget_class: [],
      other_classes: [],
    },
  },
  points: [],
};

type Combination = {
  epochs: number;
  learning_rate: number;
  batch_size: number;
};

export default function UnlearningConfiguration() {
  const { addExperiment, updateExperiment } = useContext(ExperimentsContext);
  const { saveComparison } = useContext(BaselineComparisonContext);
  const { updateIsRunning, initStatus, updateActiveStep, updateStatus } =
    useContext(RunningStatusContext);

  const { forgetClassNumber } = useForgetClass();

  const [initModel, setInitialModel] = useState(`000${forgetClassNumber}`);
  const [weightNames, setWeightNames] = useState<string[]>([]);
  const [method, setMethod] = useState("ft");
  const [epochList, setEpochList] = useState<string[]>([]);
  const [learningRateList, setLearningRateList] = useState<string[]>([]);
  const [batchSizeList, setBatchSizeList] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();

  const isCustom = method === CUSTOM;
  const totalExperimentsCount = isCustom
    ? !selectedFile
      ? 0
      : 1
    : epochList.length * learningRateList.length * batchSizeList.length;

  useEffect(() => {
    async function fetchWeights() {
      try {
        const names = await fetchAllWeightNames(forgetClassNumber);
        setWeightNames(names);
      } catch (error) {
        console.error("Failed to fetch all weights names: ", error);
      }
    }
    fetchWeights();
  }, [forgetClassNumber]);

  useEffect(() => {
    if (
      (isCustom && !selectedFile) ||
      (!isCustom &&
        (epochList.length === 0 ||
          learningRateList.length === 0 ||
          batchSizeList.length === 0))
    ) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [
    batchSizeList.length,
    epochList.length,
    isCustom,
    learningRateList.length,
    selectedFile,
  ]);

  const handleInitialModelChange = (model: string) => {
    setInitialModel(model);
  };

  const handleMethodChange = (method: string) => {
    setMethod(method);
    setEpochList([]);
    setLearningRateList([]);
    setBatchSizeList([]);
  };

  const handlePlusClick = (id: string, value: string) => {
    if (id === EPOCHS) {
      setEpochList((prev) =>
        prev.length >= 5 || prev.includes(value) ? prev : [...prev, value]
      );
    } else if (id === LEARNING_RATE) {
      setLearningRateList((prev) =>
        prev.length >= 5 || prev.includes(value) ? prev : [...prev, value]
      );
    } else if (id === BATCH_SIZE) {
      setBatchSizeList((prev) =>
        prev.length >= 5 || prev.includes(value) ? prev : [...prev, value]
      );
    }
  };

  const handleBadgeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const { id, innerHTML: target } = event.currentTarget;

    if (id === EPOCHS) {
      setEpochList((prev) => prev.filter((item) => item !== target));
    } else if (id === LEARNING_RATE) {
      setLearningRateList((prev) => prev.filter((item) => item !== target));
    } else if (id === BATCH_SIZE) {
      setBatchSizeList((prev) => prev.filter((item) => item !== target));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setSelectedFile(file);
  };

  const pollStatus = async (
    experimentIndex: number,
    learningRate?: number,
    batchSize?: number
  ) => {
    const startTime = Date.now();

    while (true) {
      const unlearningStatus = await fetchUnlearningStatus();
      const progress = getCurrentProgress(unlearningStatus);
      const completedSteps = getCompletedSteps(progress, unlearningStatus);

      updateStatus({
        status: unlearningStatus,
        forgetClass: forgetClassNumber,
        experimentIndex,
        progress,
        elapsedTime: Math.round(((Date.now() - startTime) / 1000) * 10) / 10,
        completedSteps,
        learningRate,
        batchSize,
      });

      if (progress.includes("Evaluating")) {
        updateActiveStep(2);
      } else if (progress.includes("UMAP") || progress.includes("CKA")) {
        updateActiveStep(3);
      }

      if (!unlearningStatus.is_unlearning) {
        updateActiveStep(0);

        const newData = await fetchFileData(
          forgetClassNumber,
          unlearningStatus.recent_id as string
        );
        updateExperiment(newData, experimentIndex);
        saveComparison(newData.id);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateIsRunning(true);
    initStatus(forgetClassNumber, totalExperimentsCount);
    updateActiveStep(1);

    const methodFullName =
      method === "ft"
        ? "Fine-Tuning"
        : method === "rl"
        ? "Random-Labeling"
        : method === "ga"
        ? "Gradient-Ascent"
        : "Custom";

    if (isCustom) {
      if (!selectedFile) return;

      await executeCustomUnlearning(selectedFile, forgetClassNumber);
      await pollStatus(0);
    } else {
      const combinations: Combination[] = [];
      for (const epoch of epochList) {
        for (const lr of learningRateList) {
          for (const bs of batchSizeList) {
            initialExperiment = {
              ...initialExperiment,
              id: "-",
              fc: forgetClassNumber,
              phase: "Unlearned",
              init: initModel.split(".")[0],
              method: methodFullName,
              epochs: Number(epoch),
              BS: Number(bs),
              LR: Number(lr),
            };

            addExperiment(initialExperiment, combinations.length);

            combinations.push({
              epochs: Number(epoch),
              learning_rate: Number(lr),
              batch_size: Number(bs),
            });
          }
        }
      }

      for (let idx = 0; idx < combinations.length; idx++) {
        const combination = combinations[idx];

        const runningConfig: UnlearningConfigurationData = {
          method,
          forget_class: forgetClassNumber,
          epochs: combination.epochs,
          learning_rate: combination.learning_rate,
          batch_size: combination.batch_size,
        };

        try {
          await executeMethodUnlearning(runningConfig);
          await pollStatus(
            idx,
            combination.learning_rate,
            combination.batch_size
          );
        } catch (error) {
          console.error("Error occured while unlearning: ", error);
          break;
        }
      }
    }

    updateIsRunning(false);
  };

  let configurationContent = isCustom ? (
    <CustomUnlearning
      fileName={selectedFile ? selectedFile.name : ""}
      onChange={handleFileChange}
    />
  ) : (
    <MethodUnlearning
      method={method}
      epochsList={epochList}
      learningRateList={learningRateList}
      batchSizeList={batchSizeList}
      onPlusClick={handlePlusClick}
      onBadgeClick={handleBadgeClick}
    />
  );

  return (
    <form
      className="w-full h-full flex flex-col items-start justify-between"
      onSubmit={handleSubmit}
    >
      <div className="w-full grid grid-cols-2 gap-y-2">
        <div className="flex items-center mb-1">
          <FlagIcon className="w-[15px] h-[15px] mr-1.5" />
          <Label className="text-base text-nowrap">Initial Model</Label>
        </div>
        <Select
          defaultValue={weightNames ? weightNames[0] : initModel}
          onValueChange={handleInitialModelChange}
        >
          <SelectTrigger className="h-[25px] text-base">
            <SelectValue
              placeholder={weightNames ? weightNames[0] : initModel}
            />
          </SelectTrigger>
          <SelectContent>
            {weightNames.map((weightName, idx) => {
              return (
                <SelectItem key={idx} value={weightName}>
                  {weightName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full grid grid-cols-2 gap-y-2">
        <div className="flex items-center mb-1">
          <EraserIcon className="w-4 h-4 mr-1.5 scale-[115%]" />
          <Label className="text-base text-nowrap">Unlearning Method</Label>
        </div>
        <Select defaultValue="ft" onValueChange={handleMethodChange}>
          <SelectTrigger className="h-[25px] text-base">
            <SelectValue placeholder={UNLEARNING_METHODS[0]} />
          </SelectTrigger>
          <SelectContent>
            {UNLEARNING_METHODS.map((method, idx) => {
              const chunks = method.split("-");
              const value =
                chunks.length === 1
                  ? chunks[0].toLowerCase()
                  : (chunks[0][0] + chunks[1][0]).toLowerCase();
              return (
                <SelectItem key={idx} value={value}>
                  {method}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      {configurationContent}
      {!isCustom && (
        <span
          className={`mb-1 w-full text-center ${
            batchSizeList.length === 0 ? "mt-2.5" : "mt-1"
          }`}
        >
          This configuration will generate{" "}
          <span
            className={`font-bold ${
              totalExperimentsCount > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {totalExperimentsCount}
          </span>{" "}
          experiment{totalExperimentsCount > 1 && "s"}.
        </span>
      )}
      <Button
        className={`w-full flex items-center ${isCustom ? "mt-2" : "mt-1"}`}
        disabled={isDisabled}
      >
        <PlusIcon className="w-3 h-3 mr-1.5" color="white" />
        <span className="text-base">
          Run and Add Experiment{totalExperimentsCount > 1 && "s"}
        </span>
      </Button>
    </form>
  );
}
