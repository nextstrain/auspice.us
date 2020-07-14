import React from "react"; // eslint-disable-line
import { handleDroppedFiles } from "./handleDroppedFiles";
import { P, Bold, Title, NextstrainTitle, CenterContent, Line, GitHub } from './styles';
import { version, dependencies } from "../package.json";


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
            <br/><br/>
            <Bold>Privacy: </Bold>
            {`Your dataset is visualised client-side in the browser -- no data is transmitted, and no tracking cookies are used.
            The only data downloaded from the internet is the visualisation (JS) code, fonts and any map tiles needed.
            This makes auspice.us appropriate to view datasets with sensitive information.`}
          </P>
        </CenterContent>

        <CenterContent>
            <Line/>
              <h2 style={{color: "#30353f"}}>{`Drag & Drop a dataset JSON on here to view`}</h2>
            <Line/>
        </CenterContent>


        <CenterContent>
          <P>
            {`auspice.us is part of Nextstrain, an open-source project to harness the scientific and public health potential of pathogen genome data. `}
            {`For more information about how to run the bioinformatics tools which this tool can visualise please see `}
            <a href="https://nextstrain.org/docs/bioinformatics/introduction-to-augur">the Nextstrain documentation</a>.
            {` The JSON schema for datasets is defined `}
            <a href="https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json">here</a>.
            {` For more information about the software which powers these visualisations please see `}
            <a href="https://nextstrain.github.io/auspice/">the Nextstrain/Auspice documentation</a>.
            {` Please `}
            <a href="https://github.com/nextstrain/auspice.us/issues/new/choose">make an issue</a>
            {` for any bugs, comments or questions. Thanks!`}
          </P>

          <Line/>

          <P>
            {`auspice.us ${version} is built by `}<a href="https://twitter.com/hamesjadfield">james hadfield</a>
            <br/>
            {`and uses Auspice ${dependencies.auspice}.`}
          </P>
          <NextstrainTitle/>
          <GitHub/>
        </CenterContent>

      </div>
    );
  }
}

export default SplashContent;


