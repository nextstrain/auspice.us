import { parse as _parseNewick } from "newick-js";

const parseNewick = (nwk) => {
  const {root, rootWeight, graph: [,edges]} = _parseNewick(nwk);
  const edgesByParent = new Map();

  for (const [parent, child, weight] of edges) {
    if (!edgesByParent.has(parent))
      edgesByParent.set(parent, new Set());
    edgesByParent.get(parent).add({child, weight});
  }

  const constructTree = (parent, weight) => {
    const tree = {
      // Particulars of this object are tied to getTreeStruct() below.
      name: parent.label ?? "",
      node_attrs: {
        div: Number.isFinite(weight) ? weight : 0,
      }
    };

    const childEdges = edgesByParent.get(parent);

    if (childEdges?.size) {
      tree.children = [];

      for (const {child, weight} of childEdges) {
        /* childEdges is reversed relative to the order given by the Newick input
         * due to a side-effect of the parser's internals, so we unshift()
         * instead of push() to restore the input order.
         */
        tree.children.unshift(
          constructTree(child, weight)
        );
      }
    }

    return tree;
  };

  return constructTree(root, rootWeight);
};

const getTreeStruct = (nwk) => {
  const tree = parseNewick(nwk);

  /* recursively create missing node names */
  let count = 10000,allBranchLengthsAreZero=true;
  let NodeNamesDictForDeduplicating = {};
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
