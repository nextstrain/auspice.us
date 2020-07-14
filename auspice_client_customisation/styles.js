import React from "react"; // eslint-disable-line
import styled from 'styled-components';
import { version } from "../package.json";
const logoPNG = require("./nextstrain-logo-small.png");
const gitHubLogo = require("./GitHub-Mark-32px.png");



export const Title = styled.p`
  font-weight: 500;
  font-size: 24px;
  color: white;
  padding: 5px;
  text-align: center;
  letter-spacing: 3px;
  width: 100%;
  background-color: #30353f;
`;

export const P = styled.p`
  text-align: center;
  padding: 20px;
  font-weight: 300;
  color: #30353f;
`;

export const Bold = styled.span`
  font-weight: 500;
`;


export const CenterContent = (props) => (
  <div className="row">
    <div className="col-md-1"/>
    <div className="col-md-10">
      <div wrap="wrap" style={{marginTop: 20, justifyContent: "space-around", display: "flex", flexFlow: "row wrap", placeContent: "stretch space-around", alignItems: "center"}}>
        {props.children}
      </div>
    </div>
    <div className="col-md-1"/>
  </div>
);

export const Line = () => (
  <div style={{width: "100%"}} className="line"/>
)


const titleColors = ["#4377CD", "#5097BA", "#63AC9A", "#7CB879", "#9ABE5C", "#B9BC4A", "#D4B13F", "#E49938", "#E67030", "#DE3C26"];
export const NextstrainTitle = () => (
  <a id="RainbowNextstrain" style={{textDecoration: "none", fontSize: 18}} href="https://nextstrain.org">
    <img alt="nextstrain logo" width="38px" src={logoPNG}/>
    {"Nextstrain".split("").map((letter, i) =>
      <span key={titleColors[i]} style={{color: titleColors[i], paddingLeft: 2}}>{letter}</span>
    )}
  </a>
);


export const GitHub = () => (
  <a style={{textDecoration: "none", fontSize: 18}} href="https://github.com/nextstrain/auspice.us">
    <img alt="github logo" width="25px" src={gitHubLogo}/>
    <span style={{fontWeight: 400, fontSize: "16px"}}>{" /nextstrain/auspice.us"}</span>
  </a>
);

