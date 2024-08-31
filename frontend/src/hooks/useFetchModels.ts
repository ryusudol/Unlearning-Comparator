import { useEffect } from "react";

import { fetchModelFiles } from "../https/utils";

export async function useFetchModels(
  setModels: (files: string[]) => void,
  end: "trained_models" | "unlearned_models"
) {
  useEffect(() => {
    const func = async () => {
      try {
        const data = await fetchModelFiles(end);
        setModels(data);
      } catch (error) {
        console.error(`Failed to fetch model files:`, error);

        // TODO: 개발 끝나면 아래 주석처리 제거할 것
        // if (error instanceof Error) {
        //   alert(`Failed to fetch model files: ${error.message}`);
        // } else {
        //   alert("An unknown error occurred . . .");
        // }
      }
    };
    func();
  }, [end, setModels]);
}
