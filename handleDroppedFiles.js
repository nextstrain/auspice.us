import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";


export const handleDroppedFiles = (dispatch, files) => {
  const treeReader = new window.FileReader();
  const metaReader = new window.FileReader();

  const fileReadComplete = () => {
    if (treeReader.result && metaReader.result) {
      const json = {
        tree: JSON.parse(treeReader.result),
        meta: JSON.parse(metaReader.result),
        _source: "dropped",
        _treeName: undefined,
        _url: "droppedFiles"
      };

      console.log("JSON IS:", json);

      dispatch({
        type: "CLEAN_START",
        ...createStateFromQueryOrJSONs({json: json, query: {}})
      });
      dispatch({
        type: "PAGE_CHANGE",
        displayComponent: "main"
      });

    } else {
      console.log("one file read...");
    }
  };
  const onerror = (err) => {
    console.warn("bugger!", err);
  };


  treeReader.onload = fileReadComplete;
  metaReader.onload = fileReadComplete;
  treeReader.onerror = onerror;
  metaReader.onerror = onerror;

  console.log("READING FILES!!!!")
  for (const file of files) {
    if (file.name.endsWith("_meta.json")) {
      metaReader.readAsText(file);
    } else if (file.name.endsWith("_tree.json")) {
      treeReader.readAsText(file);
    }
  }

};
