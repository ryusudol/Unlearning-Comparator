import React, { useState, useEffect } from "react";

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
  EPOCH,
  BATCH_SIZE,
  LEARNING_RATE,
} from "../../constants/experiments";
import { Label } from "../UI/label";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { PlusIcon } from "../UI/icons";
import { useRunningStatusStore } from "../../stores/runningStatusStore";
import { useExperimentsStore } from "../../stores/experimentsStore";
import { useRunningIndexStore } from "../../stores/runningIndexStore";
import { UnlearningConfigurationData } from "../../types/experiments";
import { ExperimentData } from "../../types/data";
import { fetchUnlearningStatus } from "../../utils/api/requests";
import { useModelDataStore } from "../../stores/modelDataStore";

const CUSTOM = "custom";
let initialExperiment: ExperimentData = {
  CreatedAt: "",
  ID: "",
  FC: -1,
  Type: "Unlearned",
  Base: "",
  Method: "",
  Epoch: "N/A",
  BS: "N/A",
  LR: "N/A",
  UA: "-",
  TUA: "-",
  RA: "-",
  TRA: "-",
  PA: "-",
  RTE: "-",
  FQS: "-",
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
  attack: {
    values: [],
    results: {
      entropy_above_unlearn: [],
      entropy_above_retrain: [],
      confidence_above_unlearn: [],
      confidence_above_retrain: [],
    },
  },
};

type Combination = {
  epochs: number;
  learning_rate: number;
  batch_size: number;
};

export default function UnlearningConfiguration() {
  const saveModelB = useModelDataStore((state) => state.saveModelB);
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const addExperiment = useExperimentsStore((state) => state.addExperiment);
  const updateRunningIndex = useRunningIndexStore(
    (state) => state.updateRunningIndex
  );
  const updateExperiment = useExperimentsStore(
    (state) => state.updateExperiment
  );
  const { updateIsRunning, initStatus, updateActiveStep, updateStatus } =
    useRunningStatusStore();

  const [initModel, setInitialModel] = useState(`000${forgetClass}.pth`);
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
        const names = await fetchAllWeightNames(forgetClass);
        setWeightNames(names);
      } catch (error) {
        console.error("Failed to fetch all weights names: ", error);
      }
    }
    fetchWeights();
  }, [forgetClass]);

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
    if (id === EPOCH) {
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

    if (id === EPOCH) {
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

      updateRunningIndex(experimentIndex);
      updateStatus({
        status: unlearningStatus,
        forgetClass,
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
          forgetClass,
          unlearningStatus.recent_id as string
        );
        updateExperiment(newData, experimentIndex);
        saveModelB(newData.ID);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateIsRunning(true);
    initStatus(forgetClass, totalExperimentsCount);
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

      initialExperiment = {
        ...initialExperiment,
        ID: "-",
        FC: forgetClass,
        Base: initModel.split(".")[0],
        Method: methodFullName,
      };

      addExperiment(initialExperiment, 0);

      await executeCustomUnlearning(selectedFile, forgetClass);
      await pollStatus(0);
    } else {
      const combinations: Combination[] = [];
      for (const epoch of epochList) {
        for (const lr of learningRateList) {
          for (const bs of batchSizeList) {
            initialExperiment = {
              ...initialExperiment,
              ID: "-",
              FC: forgetClass,
              Base: initModel.split(".")[0],
              Method: methodFullName,
              Epoch: Number(epoch),
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
          forget_class: forgetClass,
          epochs: combination.epochs,
          learning_rate: combination.learning_rate,
          batch_size: combination.batch_size,
          base_weights: initModel,
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

  return (
    <form
      className="w-full h-full flex flex-col items-start justify-between"
      onSubmit={handleSubmit}
    >
      <div className="w-full grid grid-cols-2 gap-y-2">
        <span className="text-base text-nowrap mb-1">Base Model</span>
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
        <Label className="text-base text-nowrap mb-1">Unlearning Method</Label>
        <Select value={method} onValueChange={handleMethodChange}>
          <SelectTrigger className="h-[25px] text-base">
            <SelectValue placeholder={UNLEARNING_METHODS[0]} />
          </SelectTrigger>
          <SelectContent>
            {UNLEARNING_METHODS.map((method, idx) => {
              const value =
                method === UNLEARNING_METHODS[0]
                  ? "ft"
                  : method === UNLEARNING_METHODS[1]
                  ? "rl"
                  : method === UNLEARNING_METHODS[2]
                  ? "ga"
                  : "custom";
              return (
                <SelectItem key={idx} value={value}>
                  {method}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      {isCustom ? (
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
          setEpoch={setEpochList}
          setLearningRate={setLearningRateList}
          setBatchSize={setBatchSizeList}
          onPlusClick={handlePlusClick}
          onBadgeClick={handleBadgeClick}
        />
      )}
      {!isCustom && (
        <span
          className={`mb-1 w-full text-center ${
            batchSizeList.length === 0 ? "mt-2.5" : "mt-1"
          }`}
        >
          These settings will build{" "}
          <span
            className={`font-bold ${
              totalExperimentsCount > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {totalExperimentsCount}
          </span>{" "}
          model{totalExperimentsCount > 1 && "s"}.
        </span>
      )}
      <Button
        className={`w-full flex items-center ${isCustom ? "mt-2" : "mt-1"}`}
        disabled={isDisabled}
      >
        <PlusIcon className="w-3 h-3 mr-1.5" color="white" />
        <span className="text-base">
          Run and Add Model{totalExperimentsCount > 1 && "s"}
        </span>
      </Button>
    </form>
  );
}
