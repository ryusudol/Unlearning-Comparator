import React, { useState, useEffect } from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";

type PropsType = {
  originalSvgContents: string[];
  unlearnedSvgContents: string[];
};

export default function Settings({
  originalSvgContents,
  unlearnedSvgContents,
}: PropsType) {
  const [modifiedOriginalSvgs, setModifiedOriginalSvgs] = useState<string[]>(
    []
  );
  const [modifiedUnlearnedSvgs, setModifiedUnlearnedSvgs] = useState<string[]>(
    []
  );
  const [selectedOriginalId, setSelectedOriginalId] = useState<
    number | undefined
  >();
  const [selectedUnlearnedId, setSelectedUnlearnedId] = useState<
    number | undefined
  >();

  useEffect(() => {
    const modifySvg = (svg: string) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const legend = svgDoc.getElementById("legend_1");

      if (!legend || !legend.parentNode) return;
      legend.parentNode.removeChild(legend);

      return new XMLSerializer().serializeToString(svgDoc);
    };

    const modified = originalSvgContents.map(modifySvg) as string[];
    setModifiedOriginalSvgs(modified);
    setSelectedOriginalId(originalSvgContents ? 4 : undefined);
  }, [originalSvgContents]);

  useEffect(() => {
    const modifySvg = (svg: string) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const legend = svgDoc.getElementById("legend_1");

      if (!legend || !legend.parentNode) return;
      legend.parentNode.removeChild(legend);

      return new XMLSerializer().serializeToString(svgDoc);
    };

    const modified = unlearnedSvgContents.map(modifySvg) as string[];
    setModifiedUnlearnedSvgs(modified);
    setSelectedUnlearnedId(unlearnedSvgContents ? 4 : undefined);
  }, [unlearnedSvgContents]);

  const createMarkup = (svg: string) => {
    return { __html: svg };
  };

  const handleOriginalThumbnailClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const id = e.currentTarget.id;
    setSelectedOriginalId(parseInt(id));
  };

  const handleUnlearnedThumbnailClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const id = e.currentTarget.id;
    setSelectedUnlearnedId(parseInt(id));
  };

  return (
    <section>
      <Title title="Embeddings" />
      <div className={styles.section}>
        <ContentBox height={495}>
          <div className={styles.wrapper}>
            <SubTitle subtitle="Original Model" />
            {originalSvgContents && (
              <div className={styles["content-wrapper"]}>
                <div className={styles["svg-wrapper"]}>
                  <div
                    id="1"
                    onClick={handleOriginalThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[0]
                    )}
                  />
                  <div
                    id="2"
                    onClick={handleOriginalThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[1]
                    )}
                  />
                  <div
                    id="3"
                    onClick={handleOriginalThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[2]
                    )}
                  />
                  <div
                    id="4"
                    onClick={handleOriginalThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[3]
                    )}
                  />
                </div>
                {selectedOriginalId && (
                  <div
                    className={styles["selected-svg"]}
                    dangerouslySetInnerHTML={createMarkup(
                      originalSvgContents[selectedOriginalId - 1]
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </ContentBox>
        <ContentBox height={495}>
          <div className={styles.wrapper}>
            <SubTitle subtitle="Unlearned Model" />
            {unlearnedSvgContents && (
              <div className={styles["content-wrapper"]}>
                <div className={styles["svg-wrapper"]}>
                  <div
                    id="1"
                    onClick={handleUnlearnedThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[0]
                    )}
                  />
                  <div
                    id="2"
                    onClick={handleUnlearnedThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[1]
                    )}
                  />
                  <div
                    id="3"
                    onClick={handleUnlearnedThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[2]
                    )}
                  />
                  <div
                    id="4"
                    onClick={handleUnlearnedThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[3]
                    )}
                  />
                </div>
                {selectedUnlearnedId && (
                  <div
                    className={styles["selected-svg"]}
                    dangerouslySetInnerHTML={createMarkup(
                      unlearnedSvgContents[selectedUnlearnedId - 1]
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </ContentBox>
      </div>
    </section>
  );
}
