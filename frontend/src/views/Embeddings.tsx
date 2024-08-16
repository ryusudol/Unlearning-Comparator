import React, { useState, useEffect, useContext } from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SvgViewer from "../components/UI/SvgViewer";
import { SvgsContext } from "../store/svgs-context";

export default function Embeddings() {
  const { retrainedSvgs, unlearnedSvgs } = useContext(SvgsContext);

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

    setEdittedetrainSvgs(retrainedSvgs.map(modifySvg) as string[]);
    setEdittedUnlearnSvgs(unlearnedSvgs.map(modifySvg) as string[]);
    setRetrainFocus(retrainedSvgs ? 4 : undefined);
    setUnlearnFocus(unlearnedSvgs ? 4 : undefined);
  }, [retrainedSvgs, unlearnedSvgs]);

  const handleThumbnailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    const idNum = +id.split("-")[1];
    if (id.includes("r")) setRetrainFocus(idNum);
    else if (id.includes("u")) setUnlearnFocus(idNum);
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
            modifiedSvgs={edittedRetrainSvgs}
            selectedSvgId={retrainFocus}
          />
          <div className={styles.divider} />
          <SvgViewer
            mode="u"
            svgs={unlearnedSvgs}
            handleThumbnailClick={handleThumbnailClick}
            modifiedSvgs={edittedUnlearnSvgs}
            selectedSvgId={unlearnFocus}
          />
        </div>
      </ContentBox>
    </section>
  );
}
