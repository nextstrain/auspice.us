import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";
import { errorNotification, warningNotification } from "@auspice/actions/notifications";
import { Dataset } from "@auspice/actions/loadData";
import { isAcceptedFileType as isAuspiceAcceptedFileType } from "@auspice/actions/filesDropped/constants";
import newickToAuspiceJson from "./parseNewick";

/* The following requires knowledge of how auspice works, is undocumented, and is liable to change since auspice
doesn't officially expose these functions */

export const handleDroppedFiles = async (dispatch, files) => {
  /* Right now we can only deal with a single dropped file.
  There are a few situations which we want to deal with which involve
  multiple files, including:
  - Frequencies JSON
  - Root sequence JSON (not yet implemented in auspice!)
  - Narratives markdown (should be dropped with the dataset JSON(s) at the same time)
  */

  const datasets = await collectDatasets(dispatch, files);
  if (Object.values(datasets).length===0) {
    return dispatch(errorNotification({
      message: `auspice.us couldn't load any of the dropped files!`,
      details: `Please consider making a GitHub issue for this to help us improve auspice.us. See the browser console for more details.`
    }));
  }
  await loadJsonDatasets(dispatch, datasets);
  return;
};

/** promisify FileReader's readAsText() so we can use it within
 * async functions via `await readJson(file)`.
 * Adapted from https://stackoverflow.com/a/51026615
 */
function readFile(file, isJSON=true) {
  return new Promise((resolve, reject) => {
    const fileReader = new window.FileReader();
    fileReader.onloadend = function(e) {
      if (isJSON) {
        const json = JSON.parse(e.target.result);
        resolve(json);
      } else {
        resolve(e.target.result);
      }
    };
    fileReader.onerror = function(e) {
      reject(e);
    };
    fileReader.readAsText(file);
  });
}

/**
 * Parse the dropped files into a collection of `Dataset` objects, which is the structure
 * Auspice uses to represent a "main" dataset JSON + any associated sidecar files.
 * If the dropped file is newick then we convert that to JSON-like structure.
 * 
 * This function currently only returns a single Dataset, and does not consider sidecars.
 * This capability will be added in future commits.
 * @param {*} files 
 * @returns 
 */
async function collectDatasets(dispatch, files) {
  const datasets = {};
  const sidecarMappings = { // suffix -> property (on `Dataset` object)
    "tip-frequencies":  "tipFrequencies",
    measurements: "measurements",
    "root-sequence": "rootSequence"
  };
  const newickFileTypes = ["new", "nwk", "newick"];
  const isMain = (f) => (
    f.name.toLowerCase().endsWith("json") &&
    Object.keys(sidecarMappings).every((suffix) => !f.name.toLowerCase().endsWith(`_${suffix}.json`))
  );
  const filesSeen = new Set(); // lowercase names of files we have read (successfully or otherwise)
  const logs = [];

  /* first loop through files to read main-dataset JSONs and tree-like files (newick etc) */
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    if (isMain(file)) {
      filesSeen.add(nameLower);
      try {
        const name = file.name.slice(0, -5) // removes ".json" suffix
          .replaceAll("_", "/"); // nextstrain-like file path display
        const d = new Dataset(name);
        d.main = await readFile(file);
        datasets[nameLower] = d;
        logs.push(`Read ${file.name} as a main dataset JSON file`);
      } catch (e) {
        console.error(`${file.name} failed to be read as a main dataset JSON file. Error: ${e}`);
      }
    } else if (newickFileTypes.some((suffix) => nameLower.endsWith(suffix))) {
      filesSeen.add(nameLower);
      try {
        const d = new Dataset(file.name);
        d.main = newickToAuspiceJson(file.name, await readFile(file, false));
        datasets[nameLower] = d;
        logs.push(`Read ${file.name} as a newick file`);
      } catch (e) {
        console.error(`${file.name} failed to be read as a newick tree. Error: ${e}`);
      }
    } else if (isAuspiceAcceptedFileType(file)) {
      filesSeen.add(nameLower);
      logs.push(`${file.name} is a metadata file and should be dropped onto the tree not the splash page`);
      dispatch(warningNotification({
        message: "Failed to parse additional metadata file!",
        details: "Please drop the metadata file after the tree has loaded."
      }));
    } 
  }

  /* are there any files we haven't (attempted to) read? */
  for (const file of files) {
    if (!filesSeen.has(file.name.toLowerCase())) {
      logs.push(`Unparsed file: ${file.name}`);
    }
  }

  console.log(logs.join("\n"))
  return datasets;
}

/**
 * Load the datasets. This will result in a switch away from the splash page.
 * Currently only one dataset is considered.
 * @param {*} dispatch 
 * @param {*} datasets 
 */
async function loadJsonDatasets(dispatch, datasets) {
  if (Object.values(datasets).length > 1) {
    console.log("Only loading the first dataset as auspice.us does not yet handle multiple datasets");
  }
  const json = await Object.values(datasets)[0].main;
  try {
    dispatch({
      type: "CLEAN_START",
      ...createStateFromQueryOrJSONs({
        json,
        secondTreeDataset: undefined,
        query: {},
        narrativeBlocks: undefined,
        mainTreeName: Object.values(datasets)[0].name,
        secondTreeName: null,
        dispatch
      })
    });
  } catch (e) {
    console.error(`Failed to parse dataset ${Object.keys(datasets)[0]}. Error: ${e}`)
    return dispatch(errorNotification({
      message: "Failed to parse the dataset!",
      details: "Please see the browser console for more details."
    }));
  }
  dispatch({type: "PAGE_CHANGE", displayComponent: "main"});
}