import { useContext } from "react";

import { MultiplicationSignIcon } from "../UI/icons";
import { CIFAR_10_CLASSES } from "../../constants/common";
import { useForgetClass } from "../../hooks/useForgetClass";
import { ForgetClassContext } from "../../stores/forget-class-context";

interface Props {
  setOpen: (open: boolean) => void;
  fetchAndSaveExperiments: (forgetClass: string) => Promise<void>;
}

export default function ForgetClassTab({
  setOpen,
  fetchAndSaveExperiments,
}: Props) {
  const { selectedForgetClasses, saveForgetClass, deleteSelectedForgetClass } =
    useContext(ForgetClassContext);

  const { forgetClass, forgetClassNumber } = useForgetClass();

  const handleForgetClassChange = async (value: string) => {
    saveForgetClass(value);
    await fetchAndSaveExperiments(value);
  };

  const handleDeleteClick = async (targetClass: string) => {
    const firstSelectedForgetClass = selectedForgetClasses[0];
    const secondSelectedForgetClass = selectedForgetClasses[1];
    const targetSelectedForgetClassesIndex = selectedForgetClasses.indexOf(
      CIFAR_10_CLASSES.indexOf(targetClass)
    );

    deleteSelectedForgetClass(targetClass);

    if (targetClass === CIFAR_10_CLASSES[forgetClassNumber]) {
      if (selectedForgetClasses.length === 1) {
        saveForgetClass(undefined);
        setOpen(true);
      } else {
        const autoSelectedForgetClass =
          targetSelectedForgetClassesIndex === 0
            ? CIFAR_10_CLASSES[secondSelectedForgetClass]
            : CIFAR_10_CLASSES[firstSelectedForgetClass];
        saveForgetClass(autoSelectedForgetClass);
        await fetchAndSaveExperiments(autoSelectedForgetClass);
      }
    }
  };

  return (
    <>
      {selectedForgetClasses.map((selectedForgetClass, idx) => {
        const isSelectedForgetClass = selectedForgetClass === forgetClass;
        const forgetClassName = CIFAR_10_CLASSES[selectedForgetClass];

        return (
          <div key={idx} className="flex items-center relative">
            <div
              className={
                "flex justify-center items-center h-[30px] pl-2.5 pr-[26px] rounded-t cursor-pointer transition " +
                (isSelectedForgetClass
                  ? "bg-white text-black"
                  : "text-white hover:bg-gray-800 relative bottom-[1px]")
              }
              onClick={() => handleForgetClassChange(forgetClassName)}
            >
              <span
                className={`px-1 font-medium ${
                  isSelectedForgetClass ? "text-black" : "text-[#64758B]"
                }`}
              >
                Forget: {forgetClassName}
              </span>
            </div>
            <MultiplicationSignIcon
              onClick={() => handleDeleteClick(forgetClassName)}
              className={
                "w-3.5 h-3.5 p-[1px] cursor-pointer rounded-full absolute right-2.5 bg-transparent transition " +
                (isSelectedForgetClass
                  ? "text-gray-500 hover:bg-gray-300"
                  : "text-gray-500 hover:bg-gray-700")
              }
            />
            {isSelectedForgetClass && (
              <div className="w-[calc(100%-19px)] h-0.5 absolute bottom-[1px] left-[10px] bg-black" />
            )}
          </div>
        );
      })}
    </>
  );
}
