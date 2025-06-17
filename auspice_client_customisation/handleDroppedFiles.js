import { createStateFromQueryOrJSONs } from "@auspice/actions/recomputeReduxState";
import { errorNotification, warningNotification } from "@auspice/actions/notifications";
import { Dataset, addEndOfNarrativeBlock, getDatasetNamesFromUrl } from "@auspice/actions/loadData";
import { parseMarkdownNarrativeFile } from "@auspice/util/parseNarrative";
import { parseMarkdown } from "@auspice/util/parseMarkdown";
import { isAcceptedFileType as isAuspiceAcceptedFileType } from "@auspice/actions/filesDropped/constants";
import newickToAuspiceJson from "./parseNewick";

/* The following requires knowledge of how auspice works, is undocumented, and is liable to change since auspice
doesn't officially expose these functions */

export const handleDroppedFiles = async (dispatch, files) => {
  const {datasets, narrative} = await collectDatasets(dispatch, files);
  if (Object.values(datasets).length===0) {
    return dispatch(errorNotification({
      message: `auspice.us couldn't load any of the dropped files!`,
      details: `Please consider making a GitHub issue for this to help us improve auspice.us. See the browser console for more details.`
    }));
  }
  await loadDatasets(dispatch, datasets, narrative);
  return;
};

/** promisify FileReader's readAsText() so we can use it within
 * async functions via `await readFile(file)`.
 * Adapted from https://stackoverflow.com/a/51026615
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new window.FileReader();
    fileReader.onloadend = async function(e) {
      let data;
      if (file.name.toLowerCase().endsWith(".json.gz")) {
        data = JSON.parse(await decompressGzipStream(file.stream()));
      } else if (file.name.toLowerCase().endsWith(".json")) {
        data = JSON.parse(e.target.result);
      } else {
        data = e.target.result;
      }
      resolve(data);
    };
    fileReader.onerror = function(e) {
      reject(e);
    };
    fileReader.readAsText(file);
  });
}

/**
 * Decompress a gzip stream using the Compression Streams API.
 * Adapted from https://stackoverflow.com/a/68829631
 */
async function decompressGzipStream(stream) {
  const ds = new DecompressionStream("gzip");
  const decompressedStream = stream.pipeThrough(ds);
  return await new Response(decompressedStream).text();
}

/**
 * Determine the dataset name from an Auspice JSON file.
 * @param {string} filename 
 * @param {string} sidecarSuffix For sidecar files
 * @returns 
 */
function getDatasetName(filename, sidecarSuffix="") {
  let datasetName = filename.toLowerCase();

  // Dataset name of sidecar files is the filename without sidecar suffix (removed here) and file extension (removed later).
  if (sidecarSuffix) {
    datasetName = datasetName.replace(`_${sidecarSuffix}`, "");
  }

  datasetName = datasetName
    .slice(0, datasetName.indexOf('.json')) // removes everything after and including ".json"
    .replaceAll("_", "/"); // nextstrain-like file path display

  return datasetName;
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
  let datasets = {};
  const sidecarMappings = { // suffix -> property (on `Dataset` object)
    "tip-frequencies":  "tipFrequencies",
    measurements: "measurements",
    "root-sequence": "rootSequence"
  };
  const jsonFileTypes = [".json", ".json.gz"];
  const newickFileTypes = ["new", "nwk", "newick"];
  const isMain = (f) => (
    jsonFileTypes.some((ext) => f.name.toLowerCase().endsWith(ext)) &&
    Object.keys(sidecarMappings).every((suffix) => !jsonFileTypes.some((ext) => f.name.toLowerCase().endsWith(`_${suffix}${ext}`)))
  );
  const filesSeen = new Set(); // lowercase names of files we have read (successfully or otherwise)
  const logs = [];

  /* first loop through files to read main-dataset JSONs and tree-like files (newick etc) */
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    if (isMain(file)) {
      filesSeen.add(nameLower);
      try {
        const name = getDatasetName(file.name);
        const d = new Dataset(name);
        d.apiCalls = {}; // ensures no prototypes mistakenly make api calls
        d.main = await readFile(file);
        datasets[name] = d;
        logs.push(`Read ${file.name} as a main dataset JSON file`);
      } catch (e) {
        console.error(`${file.name} failed to be read as a main dataset JSON file. Error: ${e}`);
      }
    } else if (newickFileTypes.some((suffix) => nameLower.endsWith(suffix))) {
      filesSeen.add(nameLower);
      try {
        const d = new Dataset(file.name);
        d.apiCalls = {}; // ensures no prototypes mistakenly make api calls
        d.main = newickToAuspiceJson(file.name, await readFile(file));
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
    if (filesSeen.has(nameLower)) continue;

    if (!jsonFileTypes.some((ext) => nameLower.endsWith(ext)) && !nameLower.endsWith(".md")) {
      dispatch(errorNotification({
        message: `Failed to load ${file.name}.`,
        details: "Please refer to the homepage for supported files, and check that your file is named properly."
      }));
      continue;
    }

    for (const [sidecarSuffix, sidecarPropName] of Object.entries(sidecarMappings)) {
      if (jsonFileTypes.some((ext) => nameLower.endsWith(`_${sidecarSuffix}${ext}`))) { // filename looks like a sidecar file?
        filesSeen.add(nameLower);
        const datasetName = getDatasetName(nameLower, sidecarSuffix);
        if (datasets[datasetName]) {
          datasets[datasetName][sidecarPropName] = readFile(file);
          logs.push(`Read ${file.name} as a sidecar file of ${datasets[datasetName].name}`);
        } else {
          dispatch(errorNotification({
            message: `Failed to load ${file.name}.`,
            details: "Does the file prefix match a corresponding dataset?"
          }));
        }
      }
    }
  }

  /* finally, load any markdown files as a narrative (after all datasets have been created) */
  let narrative;
  for (const file of files) {
    const nameLower = file.name.toLowerCase();
    if (nameLower.endsWith(".md")) {
      filesSeen.add(nameLower);
      logs.push(`Read ${file.name} as a narrative.`);
      ({datasets, narrative} = await parseNarrative(await readFile(file), datasets, logs));
      break; // don't consider multiple markdown files
    }
  }


  /* are there any files we haven't (attempted to) read? */
  for (const file of files) {
    if (!filesSeen.has(file.name.toLowerCase())) {
      logs.push(`Unparsed file: ${file.name}`);
    }
  }

  console.log(logs.join("\n"))
  return {datasets, narrative};
}

/**
 * Load the datasets. This will result in a switch away from the splash page.
 * Currently only one dataset is considered.
 * @param {*} dispatch
 * @param {*} datasets
 */
async function loadDatasets(dispatch, datasets, narrative) {

  /* access the Dataset() objects for the main and possible 2nd trees to be displayed */
  let dataset1, dataset2; // left tree, right tree
  if (narrative) {
    const [a, b] = getDatasetNamesFromUrl(narrative[0].dataset);
    dataset1 = datasets[a];
    dataset2 = datasets[b];
    if (!dataset1) {
      console.error(`Narrative starting dataset(s): ${a}, ${b}\nExpected dataset filenames: ${convertPrefixToDatasetFilename(a)}, ${convertPrefixToDatasetFilename(b)}`)
      return dispatch(errorNotification({
        message: "Could not find the starting datasets for the narrative",
        details: "Please see the browser console for more details."
      }));
    }
  } else {
    const datasetList = Object.values(datasets); // we have no sensible way of ordering these
    if (datasetList.length > 2) {
      console.log("Only loading the first two datasets");
    }
    dataset1 = datasetList[0];
    dataset2 = datasetList.length > 1 ? datasetList[1] : false;
  }

  /* load (into redux state) the main dataset(s) */
  try {
    dispatch({
      type: "CLEAN_START",
      pathnameShouldBe: "",
      ...createStateFromQueryOrJSONs({
        json: dataset1.main,
        measurementsData: dataset1.measurements ? (await dataset1.measurements) : undefined,
        secondTreeDataset: dataset2 ? dataset2.main : null,
        query: {},
        narrativeBlocks: narrative,
        mainTreeName: dataset1.name,
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
  dataset1.loadSidecars(dispatch);

  if (narrative) {
    dispatch({type: "CACHE_JSONS", jsons: datasets});
  }

  /* change page (splash page displayed until this action is dispatched) */
  dispatch({type: "PAGE_CHANGE", displayComponent: "main"});
}

/**
 * Similar to the function `loadNarrative` in Auspice but with important differences
 * as auspice.us doesn't fetch the datasets & always starts on slide 1.
 *
 * This returns a modified `datasets` object such that narrative blocks have a corresponding
 * dataset to load (if present in the drag & dropped files).
 */
async function parseNarrative(fileText, datasets, logs) {
  const datasetsForNarrative = {};
  const blocks = await parseMarkdownNarrativeFile(fileText, parseMarkdown);
  addEndOfNarrativeBlock(blocks)

  /* link each "block" to a dataset. This is not straightforward, as narrative slides
  are linked to a URL not a filepath. Auspice uses the function `getDatasetNamesFromUrl` to
  perform this linking and expects the appropriate dataset to be present in the cache.
  We therefore modify `datasets` so that these keys exist */
  logs.push("Linking narrative datasets to dropped JSON datasets.")
  const prefixesSeen = new Set();
  for (const block of blocks) {
    for (const prefix of getDatasetNamesFromUrl(block.dataset)) {
      if (prefix && !prefixesSeen.has(prefix)) {
        const filename = convertPrefixToDatasetFilename(prefix);
        // Must use lowercase filename to find dataset since the datasets
        // are stored in lowercase within collectDatasets
        const filenameLower = filename.toLowerCase();
        if (datasets[filenameLower]) {
          logs.push(`Narrative slide URL ${prefix} → ${filename}`)
          datasetsForNarrative[prefix] = datasets[filenameLower];
        } else {
          logs.push(`Narrative slide URL ${prefix} expected ${filename} but this wasn't found.`)
        }
      }
      prefixesSeen.add(prefix)
    }
  }
  return {narrative: blocks, datasets: datasetsForNarrative};
}

/**
 * Prefix here is used the context of auspice, whereby an auspice API
 * request would include the `?prefix={prefix}` query. We scan the
 * datasets of dropped files and try to find a match for each prefix.
 */
function convertPrefixToDatasetFilename(prefix) {
  if (!prefix) return undefined;
  return prefix.replaceAll("/", "_") + ".json";
}
