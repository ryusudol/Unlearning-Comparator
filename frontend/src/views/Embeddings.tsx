import React, { useState, useEffect, useContext } from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SvgViewer from "../components/UI/SvgViewer";
import { SvgsContext } from "../store/svgs-context";

export default function Embeddings() {
  const { retrainingSvgs, unlearningSvgs } = useContext(SvgsContext);

  const [edittedRetrainSvgs, setEdittedetrainSvgs] = useState<string[]>([]);
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

    setEdittedetrainSvgs(retrainingSvgs.map(modifySvg) as string[]);
    setEdittedUnlearnSvgs(unlearningSvgs.map(modifySvg) as string[]);
    setRetrainFocus(retrainingSvgs ? 4 : undefined);
    setUnlearnFocus(unlearningSvgs ? 4 : undefined);
  }, [retrainingSvgs, unlearningSvgs]);

  const handleThumbnailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    const idNum = +id.split("-")[1];
    if (id.includes("r")) setRetrainFocus(idNum);
    else if (id.includes("u")) setUnlearnFocus(idNum);
  };

  return (
    <section className={styles.embeddings}>
      <Title title="Embeddings" />
      <ContentBox height={627}>
        <div className={styles["viewers-wrapper"]}>
          <SvgViewer
            mode="r"
            svgs={retrainingSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={edittedRetrainSvgs}
            selectedSvgId={retrainFocus}
          />
          <div className={styles.divider} />
          <SvgViewer
            mode="u"
            svgs={unlearningSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={edittedUnlearnSvgs}
            selectedSvgId={unlearnFocus}
          />
        </div>
      </ContentBox>
    </section>
  );
}
