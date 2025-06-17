/**
 * Newick format parser in JavaScript.
 *
 * Copyright (c) Jason Davies 2010.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

/* NOTE: parseNewick function slightly modified to produce an object better suited for Nextstrain. */

export const parseNewick = (nwk) => {
  const ancestors = [];
  let tree = {};

  /**
   * This newick parser is known to have issues with quoted node names, as it
   * will parse the node name content as newick. As a quick fix, disallow trees
   * with quotes.
   */
  if (nwk.includes('"') || nwk.includes("'")) {
    throw new Error("Auspice.us cannot currently parse Newick files with single or double quotes in them!")
  }


  const tokens = nwk.split(/\s*(;|\(|\)|,|:)\s*/);
  for (let i=0; i<tokens.length; i++) {
    const token = tokens[i];
    const subtree = {};
    switch (token) {
      case '(': // new child nodes up next
        tree.children = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ',': // next node: another child of the last ancestor
        ancestors[ancestors.length-1].children.push(subtree);
        tree = subtree;
        break;
      case ')': // optional name next
        tree = ancestors.pop();
        break;
      case ':': // optional length next
        break;
      default: {
        const x = tokens[i-1];
        if (x === ')' || x === '(' || x === ',') {
          tree.name = token;
        } else if (x === ':') {
          tree.node_attrs = {div: parseFloat(token)};
        }
      }
    }
  }
  return tree;
};


const getTreeStruct = (nwk) => {
  const tree = parseNewick(nwk);

  /* recursively create missing node names */
  let count = 10000,allBranchLengthsAreZero=true;
  const NodeNamesDictForDeduplicating = {};
  const addNodeName = (node) => {
	if (! ("node_attrs" in node)) node.node_attrs= {};
    if (! ("div" in node.node_attrs)) node.node_attrs.div= 0;
    if (!node.name) {
      node.name=`NODE${count}`;
      count++;
    }
    if (NodeNamesDictForDeduplicating[node.name]) {
	  let i = 2;
	  while (NodeNamesDictForDeduplicating[node.name+"_"+i]) i++;
	  node.name = node.name+"_"+i;
    }
	NodeNamesDictForDeduplicating[node.name]=true;
	
    if (node.children) {
      node.children.forEach((child) => addNodeName(child));
    }
	
  };
  addNodeName(tree);

  /* divergence should be cumulative for Auspice! */
  const cumulativeDivs = (node, soFar=0) => {
    node.node_attrs.div += soFar;
	if (soFar) allBranchLengthsAreZero = false;
    if (node.children) {
      node.children.forEach((child) => cumulativeDivs(child, node.node_attrs.div));
    }
  };
  cumulativeDivs(tree);
  
  
  const setAllBranchLengthsToOne = (node,depth) => {
	node.node_attrs.div = depth;
	if (node.children) {
      node.children.forEach((child) => setAllBranchLengthsToOne(child, depth+1));
    }
  }
  if (allBranchLengthsAreZero) setAllBranchLengthsToOne(tree,0);

  return tree;
};

/**
 * Convert a newick string to an auspice (v2) JSON
 * @param {string} nwk newick string
 * @returns {object} auspice JSON
 */
const newickToAuspiceJson = (name, nwk) => {
  const json = {
    version: "2.0",
    meta: {
      title: name,
      panels: ["tree"],
      description: makeDescription(name)
    },
    tree: getTreeStruct(nwk)
  };
  return json;
};

function makeDescription(name) {
  return `
Dataset generated from the newick file "${name}"
dragged onto [auspice.us](http://auspice.us) on
${(new Date()).toLocaleDateString('en-EN', {month: "short", weekday: "short", day: "2-digit", year: "numeric"})}.

If you have metadata you wish to display, you can now drag on a CSV file and it will be added into this view,
[see here](https://nextstrain.github.io/auspice/advanced-functionality/drag-drop-csv-tsv) for more info.
`
}

export default newickToAuspiceJson;
