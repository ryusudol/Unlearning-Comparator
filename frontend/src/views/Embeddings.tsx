import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import styles from "./Embeddings.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";
import SvgViewer from "../components/UI/SvgViewer";
import retrainedData from "../constants/result_GT_1.json";
import { OverviewContext } from "../store/overview-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { modifySvg } from "../util";

interface Props {
  height: number;
}

export default function Embeddings({ height }: Props) {
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);

  const [edittedRetrainSvgs, setEdittedRetrainSvgs] = useState<string[]>([]);
  const [edittedUnlearnSvgs, setEdittedUnlearnSvgs] = useState<string[]>([]);
  const [retrainFocus, setRetrainFocus] = useState<number | undefined>(4);
  const [unlearnFocus, setUnlearnFocus] = useState<number | undefined>(4);

  const unlearnSvgs = useMemo(
    () => overview[selectedID]?.unlearn_svgs || [],
    [overview, selectedID]
  );
  const retrainByteSvgs = useMemo(
    () => Object.values(retrainedData.svg_files),
    []
  );

  const decoder = useCallback(
    () => retrainByteSvgs.slice(0, 4).map(atob),
    [retrainByteSvgs]
  );
  const retrainSvgs = useMemo(() => decoder(), [decoder]);

  useEffect(() => {
    setEdittedRetrainSvgs(retrainSvgs.map(modifySvg) as string[]);
    setEdittedUnlearnSvgs(
      overview[selectedID]?.unlearn_svgs.map(modifySvg) as string[]
    );

    setRetrainFocus(retrainSvgs ? 4 : undefined);
    setUnlearnFocus(unlearnSvgs ? 4 : undefined);
  }, [decoder, overview, retrainSvgs, selectedID, unlearnSvgs]);

  const handleThumbnailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.id;
    const idNum = +id.split("-")[1];
    if (id.includes("r")) setRetrainFocus(idNum);
    else if (id.includes("u")) setUnlearnFocus(idNum);
  };

  return (
    <section className={styles.embeddings}>
      <Title title="Embeddings" />
      <ContentBox height={height}>
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
