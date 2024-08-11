import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SvgViewer from "../components/UI/SvgViewer";
import { SvgsState } from "../types/embeddings";
import { svgsActions } from "../store/svgs";

export default function Embeddings() {
  const dispatch = useDispatch();

  const retrainedSvgs = useSelector(
    (state: SvgsState) => state.svgs.retrainedSvgs
  );
  const unlearnedSvgs = useSelector(
    (state: SvgsState) => state.svgs.unlearnedSvgs
  );

  const [modifiedRetrainedSvgs, setModifiedRetrainedSvgs] = useState<string[]>(
    []
  );
  const [modifiedUnlearnedSvgs, setModifiedUnlearnedSvgs] = useState<string[]>(
    []
  );
  const [selectedRetrainedId, setSelectedRetrainedId] = useState<
    number | undefined
  >();
  const [selectedUnlearnedId, setSelectedUnlearnedId] = useState<
    number | undefined
  >();

  useEffect(() => {
    dispatch(svgsActions.retrieveRetrainedSvgs());
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
    const modifiedRetrainedSvgs = retrainedSvgs.map(modifySvg) as string[];
    const modifiedUnlearnedSvgs = unlearnedSvgs.map(modifySvg) as string[];
    setModifiedRetrainedSvgs(modifiedRetrainedSvgs);
    setModifiedUnlearnedSvgs(modifiedUnlearnedSvgs);
    setSelectedRetrainedId(retrainedSvgs ? 4 : undefined);
    setSelectedUnlearnedId(unlearnedSvgs ? 4 : undefined);
  }, [retrainedSvgs, unlearnedSvgs]);

  const handleThumbnailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    const idNum = +id.split("-")[1];
    if (id.includes("r")) setSelectedRetrainedId(idNum);
    else if (id.includes("u")) setSelectedUnlearnedId(idNum);
  };

  return (
    <section className={styles.embeddings}>
      <Title title="Embeddings" />
      <ContentBox height={626}>
        <div className={styles["viewers-wrapper"]}>
          <SvgViewer
            mode="r"
            svgs={retrainedSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={modifiedRetrainedSvgs}
            selectedSvgId={selectedRetrainedId}
          />
          <SvgViewer
            mode="u"
            svgs={unlearnedSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={modifiedUnlearnedSvgs}
            selectedSvgId={selectedUnlearnedId}
          />
        </div>
      </ContentBox>
    </section>
  );
}
