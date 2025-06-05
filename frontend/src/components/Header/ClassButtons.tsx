import { MultiplicationSignIcon } from "../UI/icons";
import { useClasses } from "../../hooks/useClasses";
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { cn } from "../../utils/util";

interface Props {
  setOpen: (open: boolean) => void;
  fetchAndSaveExperiments: (forgetClass: string) => Promise<void>;
}

export default function ClassButtons({
  setOpen,
  fetchAndSaveExperiments,
}: Props) {
  const classes = useClasses();
  const forgetClass = useForgetClassStore((state) => state.forgetClass);
  const saveForgetClass = useForgetClassStore((state) => state.saveForgetClass);
  const selectedForgetClasses = useForgetClassStore(
    (state) => state.selectedForgetClasses
  );
  const deleteSelectedForgetClass = useForgetClassStore(
    (state) => state.deleteSelectedForgetClass
  );

  const handleForgetClassChange = async (value: string) => {
    if (classes[forgetClass] !== value) {
      saveForgetClass(value);
      await fetchAndSaveExperiments(value);
    }
  };

  const handleDeleteClick = async (targetClass: string) => {
    const firstSelectedForgetClass = selectedForgetClasses[0];
    const secondSelectedForgetClass = selectedForgetClasses[1];
    const targetSelectedForgetClassesIndex = selectedForgetClasses.indexOf(
      classes.indexOf(targetClass)
    );

    deleteSelectedForgetClass(targetClass);

    if (targetClass === classes[forgetClass]) {
      if (selectedForgetClasses.length === 1) {
        saveForgetClass(-1);
        setOpen(true);
      } else {
        const autoSelectedForgetClass =
          targetSelectedForgetClassesIndex === 0
            ? classes[secondSelectedForgetClass]
            : classes[firstSelectedForgetClass];
        saveForgetClass(autoSelectedForgetClass);
        await fetchAndSaveExperiments(autoSelectedForgetClass);
      }
    }
  };

  return (
    <>
      {selectedForgetClasses.map((selectedForgetClass, idx) => {
        const isSelectedForgetClass = selectedForgetClass === forgetClass;
        const forgetClassName = classes[selectedForgetClass];

        return (
          <div key={idx} className="flex items-center relative">
            <div
              className={cn(
                "flex justify-center items-center h-[30px] pl-2.5 pr-[26px] rounded-t transition",
                isSelectedForgetClass
                  ? "bg-white text-black cursor-default"
                  : "text-white hover:bg-gray-800 relative bottom-[1px] cursor-pointer"
              )}
              onClick={() => handleForgetClassChange(forgetClassName)}
            >
              <span
                className={cn(
                  "px-1 font-medium",
                  isSelectedForgetClass ? "text-black" : "text-[#64758B]"
                )}
              >
                Forget: {forgetClassName}
              </span>
            </div>
            <MultiplicationSignIcon
              onClick={() => handleDeleteClick(forgetClassName)}
              className={cn(
                "w-3.5 h-3.5 p-[1px] cursor-pointer rounded-full absolute right-2.5 bg-transparent transition text-gray-500",
                isSelectedForgetClass
                  ? "hover:bg-gray-300"
                  : "hover:bg-gray-700"
              )}
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
