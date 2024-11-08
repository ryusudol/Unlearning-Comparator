import { useState, useEffect } from "react";

export const useLoadingDots = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 6 ? "" : prev + " ."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return dots;
};
