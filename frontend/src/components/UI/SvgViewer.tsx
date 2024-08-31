import React from "react";
import styles from "./SvgViewer.module.css";

import SubTitle from "../SubTitle";
import Explanation from "./Explanation";

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
  const createMarkup = (svg: string) => {
    return { __html: svg };
  };

  const subtitle = mode === "r" ? "Retrained Model" : "Unlearned Model";

  return (
    <div className={styles.wrapper}>
      <SubTitle subtitle={subtitle} />
      {svgs.length === 4 && (
        <div className={styles["content-wrapper"]}>
          <div className={styles.header}>
            <Explanation mode={mode} />
            <div className={styles.thumbnails}>
              {modifiedSvgs.map((svg, idx) => (
                <div
                  key={idx}
                  id={`${mode}-${idx + 1}`}
                  onClick={handleThumbnailClick}
                  className={
                    styles[
                      `${
                        selectedSvgId === idx + 1
                          ? "selected-thumbnail"
                          : "thumbnail"
                      }`
                    ]
                  }
                  dangerouslySetInnerHTML={createMarkup(svg)}
                />
              ))}
            </div>
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
