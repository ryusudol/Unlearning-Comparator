import React, { memo, useRef, useEffect, useState } from "react";

import ConnectionLine from "./ConnectionLine";
import { Coordinate } from "../../../types/embeddings";

type Position = {
  from: Coordinate | null;
  to: Coordinate | null;
};

interface Props {
  positionRef: React.MutableRefObject<Position>;
}

const ConnectionLineWrapper = memo(({ positionRef }: Props) => {
  const [, setUpdateKey] = useState(0);
  const prevPositionRef = useRef<Position>({ from: null, to: null });

  useEffect(() => {
    const hasPositionChanged = () => {
      const current = positionRef.current;
      const prev = prevPositionRef.current;

      if (!current.from !== !prev.from || !current.to !== !prev.to) return true;
      if (!current.from || !current.to) return false;
      if (!prev.from || !prev.to) return true;

      return (
        current.from.x !== prev.from.x ||
        current.from.y !== prev.from.y ||
        current.to.x !== prev.to.x ||
        current.to.y !== prev.to.y
      );
    };

    const intervalId = setInterval(() => {
      if (hasPositionChanged()) {
        prevPositionRef.current = {
          from: positionRef.current.from
            ? { ...positionRef.current.from }
            : null,
          to: positionRef.current.to ? { ...positionRef.current.to } : null,
        };
        setUpdateKey((prev) => prev + 1);
      }
    }, 16);

    return () => clearInterval(intervalId);
  }, [positionRef]);

  return (
    <ConnectionLine
      from={positionRef.current.from}
      to={positionRef.current.to}
    />
  );
});

export default ConnectionLineWrapper;
