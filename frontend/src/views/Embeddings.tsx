import React, { useState, useEffect, useContext, useMemo } from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SvgViewer from "../components/UI/SvgViewer";
import { OverviewContext } from "../store/overview-context";
import { SelectedIDContext } from "../store/selected-id-context";

export default function Embeddings() {
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);

  const retrainSvgs = useMemo(
    () => overview[selectedID]?.retrain_svgs || [],
    [overview, selectedID]
  );
  const unlearnSvgs = useMemo(
    () => overview[selectedID]?.unlearn_svgs || [],
    [overview, selectedID]
  );

  const [edittedRetrainSvgs, setEdittedRetrainSvgs] = useState<string[]>([]);
  const [edittedUnlearnSvgs, setEdittedUnlearnSvgs] = useState<string[]>([]);
  const [retrainFocus, setRetrainFocus] = useState<number | undefined>(4);
  const [unlearnFocus, setUnlearnFocus] = useState<number | undefined>(4);

  useEffect(() => {
    const modifySvg = (svg: string) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const legend = svgDoc.getElementById("legend_1");
      if (!legend || !legend.parentNode) return;
      legend.parentNode.removeChild(legend);
      return new XMLSerializer().serializeToString(svgDoc);
    };

    setEdittedRetrainSvgs(
      overview[selectedID]?.retrain_svgs.map(modifySvg) as string[]
    );
    setEdittedUnlearnSvgs(
      overview[selectedID]?.unlearn_svgs.map(modifySvg) as string[]
    );
    setRetrainFocus(retrainSvgs ? 4 : undefined);
    setUnlearnFocus(unlearnSvgs ? 4 : undefined);
  }, [overview, retrainSvgs, selectedID, unlearnSvgs]);

  const handleThumbnailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    const idNum = +id.split("-")[1];
    if (id.includes("r")) setRetrainFocus(idNum);
    else if (id.includes("u")) setUnlearnFocus(idNum);
  };

  return (
    <section className={styles.embeddings}>
      <Title title="Embeddings" />
      <ContentBox height={642}>
        <div className={styles["viewers-wrapper"]}>
          <SvgViewer
            mode="r"
            svgs={retrainSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={edittedRetrainSvgs}
            selectedSvgId={retrainFocus}
          />
          <div className={styles.divider} />
          <SvgViewer
            mode="u"
            svgs={unlearnSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={edittedUnlearnSvgs}
            selectedSvgId={unlearnFocus}
          />
        </div>
      </ContentBox>
    </section>
  );
}
