import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";
import { errorNotification, warningNotification } from "@auspice/actions/notifications";
import { Dataset } from "@auspice/actions/loadData";
import { isAcceptedFileType as isAuspiceAcceptedFileType } from "@auspice/actions/filesDropped/constants";
import newickToAuspiceJson from "./parseNewick";

/* The following requires knowledge of how auspice works, is undocumented, and is liable to change since auspice
doesn't officially expose these functions */

export const handleDroppedFiles = async (dispatch, files) => {
  const datasets = await collectDatasets(dispatch, files);
  if (Object.values(datasets).length===0) {
    return dispatch(errorNotification({
      message: `auspice.us couldn't load any of the dropped files!`,
      details: `Please consider making a GitHub issue for this to help us improve auspice.us. See the browser console for more details.`
    }));
  }
  await loadDatasets(dispatch, datasets);
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
 * This function currently only returns a single Dataset with sidecars, as applicable.
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

  /* loop through files and, if a sidecar, load it into the associated `Dataset` object */
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    if (filesSeen.has(nameLower) || !nameLower.endsWith("json")) continue;
    for (const [sidecarSuffix, sidecarPropName] of Object.entries(sidecarMappings)) {
      if (nameLower.endsWith(`_${sidecarSuffix}.json`)) { // filename looks like a sidecar file?
        filesSeen.add(nameLower);
        const mainNameLower = nameLower.replace(`_${sidecarSuffix}.json`, '.json');
        if (datasets[mainNameLower]) {
          datasets[mainNameLower][sidecarPropName] = readFile(file);
          logs.push(`Read ${file.name} as a sidecar file of ${datasets[mainNameLower].name}`);
        } else {
          logs.push(`Sidecar file ${file.name} has no associated main dataset file and has been skipped.`);
        }
      }
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
async function loadDatasets(dispatch, datasets) {
  const datasetList = Object.values(datasets); // we have no sensible way of ordering these
  if (datasetList.length > 2) {
    console.log("Only loading the first two datasets");
  }
  const dataset = datasetList[0];
  const dataset2 = datasetList.length > 1 ? datasetList[1] : false;

  /* load (into redux state) the main dataset(s) */
  try {
    dispatch({
      type: "CLEAN_START",
      ...createStateFromQueryOrJSONs({
        json: dataset.main,
        secondTreeDataset: dataset2 ? dataset2.main : null,
        query: {},
        narrativeBlocks: undefined,
        mainTreeName: dataset.name,
        secondTreeName: dataset2 ? dataset2.name : null,
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

  /* load (into redux state) sidecar files (if there are any) */
  dataset.loadSidecars(dispatch);

  /* change page (splash page displayed until this action is dispatched) */
  dispatch({type: "PAGE_CHANGE", displayComponent: "main"});
}