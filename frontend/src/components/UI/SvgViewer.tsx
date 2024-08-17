import React, { useContext, useEffect } from "react";
import styles from "./SvgViewer.module.css";

import SubTitle from "../SubTitle";
import Explanation from "./Explanation";
import { RetrainingConfigContext } from "../../store/retraining-config-context";
import { UnlearningConfigContext } from "../../store/unlearning-config-context";
import { SvgsContext } from "../../store/svgs-context";

interface Props {
  mode: "r" | "u";
  svgs: string[];
  handleThumbnailClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  modifiedSvgs: string[];
  selectedSvgId: number | undefined;
}

export default function SvgViewer({
  mode,
  svgs,
  handleThumbnailClick,
  modifiedSvgs,
  selectedSvgId,
}: Props) {
  const { retrieveRetrainingSvgs, retrieveUnlearningSvgs } =
    useContext(SvgsContext);

  const { method, retrieveUnlearningConfig } = useContext(
    UnlearningConfigContext
  );
  const { retrieveRetrainingConfig } = useContext(RetrainingConfigContext);

  useEffect(() => {
    retrieveRetrainingConfig();
    retrieveUnlearningConfig();
    retrieveRetrainingSvgs();
    retrieveUnlearningSvgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMarkup = (svg: string) => {
    return { __html: svg };
  };

  const subtitle = mode === "r" ? "Retrained Model" : "Unlearned Model";

  return (
    <div className={styles.wrapper}>
      <SubTitle subtitle={subtitle} />
      {svgs.length > 0 && (mode === "r" || (mode === "u" && method !== "")) && (
        <Explanation mode={mode} />
      )}
      {svgs && (
        <div className={styles["content-wrapper"]}>
          <div className={styles.thumbnails}>
            <div
              id={`${mode}-1`}
              onClick={handleThumbnailClick}
              className={styles.thumbnail}
              dangerouslySetInnerHTML={createMarkup(modifiedSvgs[0])}
            />
            <div
              id={`${mode}-2`}
              onClick={handleThumbnailClick}
              className={styles.thumbnail}
              dangerouslySetInnerHTML={createMarkup(modifiedSvgs[1])}
            />
            <div
              id={`${mode}-3`}
              onClick={handleThumbnailClick}
              className={styles.thumbnail}
              dangerouslySetInnerHTML={createMarkup(modifiedSvgs[2])}
            />
            <div
              id={`${mode}-4`}
              onClick={handleThumbnailClick}
              className={styles.thumbnail}
              dangerouslySetInnerHTML={createMarkup(modifiedSvgs[3])}
            />
          </div>
          {selectedSvgId && (
            <div
              className={styles["selected-svg"]}
              dangerouslySetInnerHTML={createMarkup(svgs[selectedSvgId - 1])}
            />
          )}
        </div>
      )}
    </div>
  );
}
