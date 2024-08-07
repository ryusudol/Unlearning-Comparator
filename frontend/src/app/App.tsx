import styles from "./App.module.css";

import Title from "../components/Title";
import ContentBox from "../components/ContentBox";

import Settings from "../views/Settings";
import Archives from "../views/Archives";
import Embeddings from "../views/Embeddings";
import PerformanceMetrics from "../views/PerformanceMetrics";
import PrivacyAttacks from "../views/PrivacyAttacks";

export default function App() {
  return (
    <section id={styles["body-wrapper"]}>
      <div>
        <Settings />
        <Archives />
        {/* dummy */}
        <div>
          <Title title="Dummy" />
          <ContentBox height={436}>어디로 가야 하오 , , ,</ContentBox>
        </div>
        {/* dummy */}
      </div>
      <div>
        <Embeddings />
        <PerformanceMetrics />
      </div>
      <PrivacyAttacks />
    </section>
  );
}
