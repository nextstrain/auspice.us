import React from "react";
import { handleDroppedFiles } from "./handleDroppedFiles";
import { P, Bold, Title, NextstrainTitle, CenterContent, Line, GitHub } from './styles';
import pkg from "../package.json";


class SplashContent extends React.Component {
  constructor(props) {
    super(props);
    this.handleDrop = this.handleDrop.bind(this);
  }
  componentDidMount() {
    document.addEventListener("dragover", this.handleDragover, false);
    document.addEventListener("drop", this.handleDrop, false);
  }

  componentWillUnmount() {
    console.log("Removing auspice.us event listeners");
    document.removeEventListener("dragover", this.handleDragover, false);
    document.removeEventListener("drop", this.handleDrop, false);
  }

  handleDragover (event) {
    event.preventDefault();
  }

  handleDrop (event) {
    event.preventDefault();
    handleDroppedFiles(this.props.dispatch, event.dataTransfer.files);
  }

  datasetLink(path) {
    return (
      <div
        style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
        onClick={() => this.props.dispatch(this.props.changePage({path, push: true}))}
      >
        {path}
      </div>
    );
  }
  render() {
    return (
      <div className="static container">

        <CenterContent>
          <Title>auspice.us</Title>
          <P>
            <Bold>
              {`auspice.us allows interactive exploration of phylogenomic datasets by simply dragging & dropping them onto this page.`}
            </Bold>
          </P>
          <P>
            <Bold>Privacy: </Bold>
            {`Your dataset is visualised client-side in the browser -- no data is transmitted, and no tracking cookies are used.
            The only data downloaded from the internet is the visualisation (JavaScript) code, fonts and any map tiles needed.
            This makes auspice.us appropriate to view datasets with sensitive information.`}
          </P>
        </CenterContent>

        <CenterContent>
            <Line/>
              <h2 style={{color: "#30353f", fontSize: 24}}>{`Drag & Drop a dataset on here to view`}</h2>
            <Line/>
        </CenterContent>


        <CenterContent>
          <P>
            Currently supported files:
            <ul>
              <li>Auspice datasets (a main JSON plus any sidecars). See the
                <a href="https://nextstrain.org/docs/bioinformatics/introduction-to-augur"> Nextstrain docs </a>
                for how to run the bioinformatics tools to generate these datasets.
                Note that it's possible to drag on multiple datasets, however at most two will be loaded, and it's not possible to control the ordering of these datasets!
              </li>
              <li>A nextstrain narrative and associated datasets (JSONs) - see the
                <a href="https://docs.nextstrain.org/en/latest/tutorials/narratives-how-to-write.html"> Nextstrain docs </a>
                for how author a narrative. Each dataset the narrative references should have a filename which is the
                <a href="https://en.wikipedia.org/wiki/URL"> URL path</a> but with forward slashes replaced with underscores ("/"→"_") and a ".json" suffix.
                Only one narrative can be dropped on at a time!
              </li>
              <li>
                A phylogenetic tree in
                <a href="https://en.wikipedia.org/wiki/Newick_format"> Newick format</a>
              </li>
              <li>
                Additional metadata as a CSV/TSV (drop this on once the tree has loaded).
                <a href="https://nextstrain.github.io/auspice/advanced-functionality/drag-drop-csv-tsv"> See here for details.</a>
              </li>
            </ul>
          </P>

          <P>
            {`auspice.us is part of `}
            <Bold>Nextstrain</Bold>
            {`, an open-source project to harness the scientific and public health potential of pathogen genome data. `}
            {` For more information about the software which powers these visualisations please see `}
            <a href="https://nextstrain.github.io/auspice/">the Auspice documentation</a>.
            </P><P>
            {` For any bugs, comments or questions, please either `}
            <a href="https://github.com/nextstrain/auspice.us/issues/new/choose">make a GitHub issue</a>
            {` or create a post on the `}
            <a href="https://discussion.nextstrain.org">Nextstrain discussion forum</a>
            {`. Thanks!`}
          </P>

          <Line/>

          <P>
            {`auspice.us ${pkg.version} (Auspice ${pkg.dependencies.auspice})`}
          </P>
          <NextstrainTitle/>
          <GitHub/>
        </CenterContent>

      </div>
    );
  }
}

export default SplashContent;


