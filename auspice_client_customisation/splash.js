import React from "react"; // eslint-disable-line
import { CenterContent } from "@auspice/components/splash/centerContent"; // eslint-disable-line
import { handleDroppedFiles } from "./handleDroppedFiles";
import { P, Title, NextstrainTitle } from './styles';
import { version } from "../package.json";


class SplashContent extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    document.addEventListener("dragover", (e) => {e.preventDefault();}, false);
    document.addEventListener("drop", (e) => {
      e.preventDefault();
      handleDroppedFiles(this.props.dispatch, e.dataTransfer.files);
    }, false);
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
            {`auspice.us allows interactive exploration of phylogenomic datasets by simply dragging & dropping them onto this page.`}
            <br/>
            {`No server is required and no data leaves your browser.`}
          </P>
        </CenterContent>

        <CenterContent>
          <div>
            <h2>{`Drag & Drop your JSONs on here to view them`}</h2>
          </div>
        </CenterContent>



        <CenterContent>
          <P>
            {`auspice.us uses Nextstrain, an open-source project to harness the scientific and public health potential of pathogen genome data. `}
            {`For more information about how to run the bioinformatics tools which this tool can visualise please see `}
            <a href="https://nextstrain.org/docs/bioinformatics/introduction-to-augur">the Nextstrain documentation</a>.
            {`For more information about the software which powers these visualisations please see `}
            <a href="https://nextstrain.github.io/auspice/">the Nextstrain/Auspice documentation</a>.
          </P>

          <P>{`auspice.us is built by `}<a href="https://twitter.com/hamesjadfield">james hadfield</a></P>
          <NextstrainTitle/>
          <P>{`uses `}<a href="https://github.com/nextstrain/auspice">auspice</a>{` v${version}`}</P>
        </CenterContent>

      </div>
    );
  }
}

export default SplashContent;


