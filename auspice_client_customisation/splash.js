import React from "react"; // eslint-disable-line
import { CenterContent } from "@auspice/components/splash/centerContent"; // eslint-disable-line
import { handleDroppedFiles } from "./handleDroppedFiles";

const p = {textAlign: "center", padding: "20px"};

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
    console.log("props", this.props);
    return (
      <div className="static container">
        <h1 style={p}>
          auspice.us
        </h1>
        <div style={p}>
          {`auspice.us allows interactive exploration of phylogenomic datasets and is targetted at academic use.
          Simply drag and drop your datasets on to visualise them.
          Alternatively, datasets may be sourced from your own github repo, instructions here.
          `}
        </div>
        <div style={p}>
          {`Auspice is an open-source javascript package for visualising phylogenomic data.
          It is the code that powers the data exploration of nextstrain.org and this website.
          Auspice may be run locally on your computer (instructions here).
          Alternatively, it may be turned into a website, with easy customisation, such as this one.
          Instructions on how to customise auspice into your own website are here.
          `}
        </div>

        <CenterContent>
          <div>
            <h2>{`Drag & Drop your JSONs on here to view them`}</h2>
            <h2>Github sourced Examples:</h2>
            <ul>
              <li>{this.datasetLink("community/blab/zika-colombia")}</li>
            </ul>
          </div>
        </CenterContent>

        <CenterContent>
          <p>{`auspice.us is built by `}<a href="https://twitter.com/hamesjadfield">james hadfield</a></p>
          <p>{`auspice.us is powered by `}<a href="https://github.com/nextstrain/auspice">auspice</a></p>
        </CenterContent>

      </div>
    );
  }
}

export default SplashContent;
