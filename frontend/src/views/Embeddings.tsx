import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SubTitle from "../components/SubTitle";
import { SvgsState } from "../types/embeddings";
import { svgsActions } from "../store/svgs";

export default function Settings() {
  const dispatch = useDispatch();

  const originalSvgs = useSelector(
    (state: SvgsState) => state.svgs.originalSvgs
  );
  const unlearnedSvgs = useSelector(
    (state: SvgsState) => state.svgs.unlearnedSvgs
  );

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
    dispatch(svgsActions.retrieveOriginalSvgs());
    dispatch(svgsActions.retrieveUnlearnedSvgs());
  }, [dispatch]);

  useEffect(() => {
    const modifySvg = (svg: string) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const legend = svgDoc.getElementById("legend_1");
      if (!legend || !legend.parentNode) return;
      legend.parentNode.removeChild(legend);
      return new XMLSerializer().serializeToString(svgDoc);
    };
    const modifiedOriginalSvgs = originalSvgs.map(modifySvg) as string[];
    const modifiedUnlearnedSvgs = unlearnedSvgs.map(modifySvg) as string[];
    setModifiedOriginalSvgs(modifiedOriginalSvgs);
    setModifiedUnlearnedSvgs(modifiedUnlearnedSvgs);
    setSelectedOriginalId(originalSvgs ? 4 : undefined);
    setSelectedUnlearnedId(unlearnedSvgs ? 4 : undefined);
  }, [originalSvgs, unlearnedSvgs]);

  const createMarkup = (svg: string) => {
    return { __html: svg };
  };

  const handleThumbnailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    const idNum = +id.split("-")[1];
    if (id.includes("o")) setSelectedOriginalId(idNum);
    else if (id.includes("u")) setSelectedUnlearnedId(idNum);
  };

  return (
    <section>
      <Title title="Embeddings" />
      <div className={styles.section}>
        <ContentBox height={495}>
          <div className={styles.wrapper}>
            <SubTitle subtitle="Retrained Model" />
            {originalSvgs && (
              <div className={styles["content-wrapper"]}>
                <div className={styles["svg-wrapper"]}>
                  <div
                    id="o-1"
                    onClick={handleThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[0]
                    )}
                  />
                  <div
                    id="o-2"
                    onClick={handleThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[1]
                    )}
                  />
                  <div
                    id="o-3"
                    onClick={handleThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedOriginalSvgs[2]
                    )}
                  />
                  <div
                    id="o-4"
                    onClick={handleThumbnailClick}
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
                      originalSvgs[selectedOriginalId - 1]
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
            {unlearnedSvgs && (
              <div className={styles["content-wrapper"]}>
                <div className={styles["svg-wrapper"]}>
                  <div
                    id="u-1"
                    onClick={handleThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[0]
                    )}
                  />
                  <div
                    id="u-2"
                    onClick={handleThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[1]
                    )}
                  />
                  <div
                    id="u-3"
                    onClick={handleThumbnailClick}
                    className={styles.svg}
                    dangerouslySetInnerHTML={createMarkup(
                      modifiedUnlearnedSvgs[2]
                    )}
                  />
                  <div
                    id="u-4"
                    onClick={handleThumbnailClick}
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
                      unlearnedSvgs[selectedUnlearnedId - 1]
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
