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
import { retrainedData } from "../constants/gt";
import { OverviewContext } from "../store/overview-context";
import { SelectedIDContext } from "../store/selected-id-context";
import { BaselineContext } from "../store/baseline-context";
import { modifySvg } from "../util";

interface Props {
  height: number;
}

export default function Embeddings({ height }: Props) {
  const { overview } = useContext(OverviewContext);
  const { selectedID } = useContext(SelectedIDContext);
  const { baseline } = useContext(BaselineContext);

  const [edittedRetrainSvgs, setEdittedRetrainSvgs] = useState<string[]>([]);
  const [edittedUnlearnSvgs, setEdittedUnlearnSvgs] = useState<string[]>([]);
  const [retrainFocus, setRetrainFocus] = useState<number | undefined>(4);
  const [unlearnFocus, setUnlearnFocus] = useState<number | undefined>(4);

  const currOverview = overview.filter(
    (item) => item.forget_class === baseline.toString()
  );

  const retrainByteSvgs = useMemo(
    () => Object.values(retrainedData[baseline].svg_files),
    [baseline]
  );
  const unlearnSvgs = useMemo(
    () => currOverview[selectedID]?.unlearn_svgs || [],
    [currOverview, selectedID]
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
