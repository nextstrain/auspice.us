import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";


export const handleDroppedFiles = (dispatch, files) => {

  const v2DatasetReader = new window.FileReader();
  v2DatasetReader.onloadstart = () => {
    console.log("Reading JSON");
  }
  v2DatasetReader.onload = (event) => {
    const json = JSON.parse(event.target.result);
    console.log("JSON", json);
    /* The following is undocumented */
    dispatch({
      type: "CLEAN_START",
      ...createStateFromQueryOrJSONs({json: json, query: {}})
    });
    dispatch({
      type: "PAGE_CHANGE",
      displayComponent: "main"
    });
  }
  v2DatasetReader.onerror = handleError;

  if (files.length > 1 || !files[0].name.endsWith(".json")) {
    console.error("Can only process a single JSON currently");
    return;
  }
  console.log(files, v2DatasetReader);
  v2DatasetReader.readAsText(files[0]);

};


function handleError(err) {
  console.error("Error reading JSON", err);
  console.error("Please make a GitHub Issue so we can fix this!")
};