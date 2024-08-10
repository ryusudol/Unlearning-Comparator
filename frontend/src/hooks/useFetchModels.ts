import { useEffect } from "react";

import { fetchModelFiles } from "../http";

export async function useFetchModels(
  setModels: (files: string[]) => void,
  end: string
) {
  useEffect(() => {
    const func = async () => {
      try {
        const data = await fetchModelFiles(end);
        setModels(data);
      } catch (err) {
        alert("Failed to fetch model files.");
        console.error(err);
      }
    };
    func();
  }, [end, setModels]);
}
