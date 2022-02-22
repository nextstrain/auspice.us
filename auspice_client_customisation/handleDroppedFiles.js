import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";
import { errorNotification, warningNotification } from "@auspice/actions/notifications";
import { isAcceptedFileType as isAuspiceAcceptedFileType } from "@auspice/actions/filesDropped/constants";
import newickToAuspiceJson from "./parseNewick";

/* The following requires knowledge of how auspice works, is undocumented, and is liable to change since auspice
doesn't officially expose these functions */

export const handleDroppedFiles = (dispatch, files) => {

  /* Right now we can only deal with a single dropped file.
  There are a few situations which we want to deal with which involve
  multiple files, including:
  - Frequencies JSON
  - Root sequence JSON (not yet implemented in auspice!)
  - Narratives markdown (should be dropped with the dataset JSON(s) at the same time)
  */
  if (files.length !== 1) {
    return dispatch(errorNotification({
      message: `auspice.us can only handle a single dropped file`,
      details: `${files.length} were dropped!`
    }));
  }
  const file = files[0];
  const fileReader = new window.FileReader();
  fileReader.onloadstart = () => {
    console.log(`Reading dropped file ${file.name}`);
  }
  fileReader.onload = (event) => {
    let state;
    try {
      let json;
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith("json")) {
        console.log("Parsing dropped file as Auspice v2 JSON");
        json = JSON.parse(event.target.result);
      } else if (fileName.endsWith("new") || fileName.endsWith("nwk") || fileName.endsWith("newick")) {
        console.log("Parsing dropped file as a newick tree with branch lengths of divergence");
        json = newickToAuspiceJson(file.name, event.target.result);
      /**
       * Added as another `else if` statement after the checks for JSON and
       * Newick files on the off chance that Auspice accepts these file types
       * in the future. -Jover, 10 Dec 2021
       */
      } else if (isAuspiceAcceptedFileType(file)) {
          console.log("Dropped metadata file cannot be parsed by auspice.us");
          return dispatch(warningNotification({
            message: "Failed to parse additional metadata file!",
            details: "Please drop the additional metadata file after the tree has loaded."
          }));
      } else {
        throw new Error("Parser for this file type not (yet) implemented");
      }
      state = createStateFromQueryOrJSONs({json: json, query: {}});
    } catch (err) {
      return dispatch(errorNotification({
        message: `auspice.us attempted to read this file but failed!`,
        details: `Please consider making a GitHub issue for this to help us improve auspice.us. Error message: ${err.message}`
      }));
    }

    // Load the (parsed) tree data into redux store
    dispatch({type: "CLEAN_START", ...state});
    // Load the "main" page, otherwise we'll always be seeing the splash page!
    dispatch({type: "PAGE_CHANGE", displayComponent: "main"});
  }
  fileReader.onerror = (err) => {
    return dispatch(errorNotification({
      message: `auspice.us attempted to parse this file but failed!`,
      details: `Please consider making a GitHub issue for this to help us improve auspice.us. Error message: ${err.message}`
    }));
  };
  fileReader.readAsText(file)
};
