import React from "react"; // eslint-disable-line
import styled from 'styled-components';
import { version } from "../package.json";
const logoPNG = require("./nextstrain-logo-small.png");

export const Title = styled.p`
  font-weight: 500;
  font-size: 24px;
`;

export const P = styled.p`
  text-align: center;
  padding: 20px;
  font-weight: 300;
`;




const titleColors = ["#4377CD", "#5097BA", "#63AC9A", "#7CB879", "#9ABE5C", "#B9BC4A", "#D4B13F", "#E49938", "#E67030", "#DE3C26"];
export const NextstrainTitle = () => (
  <a id="RainbowNextstrain" style={{textDecoration: "none", fontSize: 20}} href="https://nextstrain.org">
    <img alt="nextstrain logo" width="40px" src={logoPNG}/>
    {"Nextstrain".split("").map((letter, i) =>
      <span key={titleColors[i]} style={{color: titleColors[i], paddingLeft: 2}}>{letter}</span>
    )}
  </a>
);