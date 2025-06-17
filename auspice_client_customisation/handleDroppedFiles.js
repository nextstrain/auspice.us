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
    return narrative ?
      dispatch(errorNotification({
        message: `auspice.us couldn't load the narrative!`,
        details: `None of the referenced datasets were provided.`
      })) :
      dispatch(errorNotification({
        message: `auspice.us couldn't load any of the dropped files!`,
        details: `Please consider making a GitHub issue for this to help us improve auspice.us. See the browser console for more details.`
      }));
  }
  await loadDatasets(dispatch, datasets, narrative);
  return;
};


/* CONSTANTS */
const JSON_SUFFIXES = [".json", ".auspicejson"];
const NARRATIVE_SUFFIXES = [".md"];
const SIDECAR_SUFFIXES = { // suffix -> property (on `Dataset` object)
  "_tip-frequencies":  "tipFrequencies",
  _measurements: "measurements",
  "_root-sequence": "rootSequence"
};
const NEWICK_SUFFIXES = ["new", "nwk", "newick"];
const COMPRESSIONS = {
  ".gz": async (file) => decompressGzipStream(file.stream()),
  ".gzip": async (file) => decompressGzipStream(file.stream()),
};
const FILE_TYPES = {
  MAIN: 'MAIN',
  SIDECAR: 'SIDECAR',
  NEWICK: 'NEWICK',
  NARRATIVE: 'NARRATIVE',
  AUSPICE_DRAG_DROP: 'AUSPICE_DRAG_DROP',
};


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
 * Parse the dropped files into a list of `Dataset` objects, which is the structure
 * Auspice uses to represent a "main" dataset JSON + any associated sidecar files.
 * If the dropped file is newick then we convert that to JSON-like structure and
 * likewise instantiate a `Dataset` object.
 * 
 * 
 */
async function collectDatasets(dispatch, files) {
  const droppedFiles = Array.from(files).map(makeDroppedFile);
  const datasets = {};
  const logs = [];

  /* Parse any files which will be treated as the main dataset (JSON or NEWICK) */
  for (const droppedFile of droppedFiles.filter((d) => d.type===FILE_TYPES.MAIN || d.type===FILE_TYPES.NEWICK)) {
    const nwk = droppedFile.type===FILE_TYPES.NEWICK;
    try {
      const contents = await droppedFile.readFile();
      datasets[droppedFile.urlName] = new Dataset(droppedFile.urlName);
      datasets[droppedFile.urlName].apiCalls = {}; // ensures no prototypes mistakenly make api calls
      datasets[droppedFile.urlName].main = nwk ? newickToAuspiceJson(droppedFile.urlName, contents) : contents;
      await droppedFile.readFile();
      logs.push(`Read ${droppedFile.file.name} as a main dataset ${nwk?'Newick':'JSON'} file under name ${droppedFile.urlName}`);
    } catch (e) {
      console.error(`${droppedFile.file.name} failed to be read as a main dataset ${nwk?'Newick':'JSON'} file. Error: ${e}`);
    }
  }

  /**
   * For every sidecar file link it to the associated `Dataset` object
   * (For this to work we must have first parsed all main JSON dataset files)
   */
  for (const droppedFile of droppedFiles.filter((d) => d.type===FILE_TYPES.SIDECAR)) {
    const associatedDataset = datasets[droppedFile.urlName];
    if (associatedDataset) {
      associatedDataset[droppedFile.sidecarPropName] = droppedFile.readFile(); // unresolved promise
      logs.push(`Read ${droppedFile.file.name} as a sidecar file (dataset: ${droppedFile.urlName})`);
    } else {
      dispatch(errorNotification({
        message: `Failed to load sidecar file ${droppedFile.file.name}.`,
        details: "Does the file prefix match a corresponding dataset?"
      }));
    }
  }

  /* finally, load any markdown files as a narrative (after all datasets have been created) */
  let narrative;
  for (const droppedFile of droppedFiles.filter((d) => d.type===FILE_TYPES.NARRATIVE)) {
    logs.push(`Reading narrative file ${droppedFile.file.name}...`);
    narrative = await parseNarrative(await droppedFile.readFile(), datasets, logs);
    break; // don't consider multiple markdown files
  }

  /* Dispatch warnings for files which should be dragged onto the Auspice viz instead */
  for (const droppedFile of droppedFiles.filter((d) => d.type===FILE_TYPES.AUSPICE_DRAG_DROP)) {
    logs.push(`${droppedFile.file.name} is a metadata file and should be dropped onto the tree not the splash page`);
    dispatch(warningNotification({
      message: "Failed to parse additional metadata file!",
      details: "Please drop the metadata file after the tree has loaded."
    }));
  }

  /* are there any files we don't know what to do with? */
  for (const droppedFile of droppedFiles.filter((d) => d.type===undefined)) {
    logs.push(`Unparsed file: ${droppedFile.file.name}`);
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
      console.error(`Narrative opening slide requires a dataset for ${a} but this is not provided`)
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
  const slides = await parseMarkdownNarrativeFile(fileText, parseMarkdown);
  addEndOfNarrativeBlock(slides)

  /**
   * Each narrative slide specifies a dataset (referenced elsewhere as the 'urlName'
   * which is the keys of `datasets`)
   */
  const referencedUrlNames = Array.from(new Set(
    slides.map((slide) => getDatasetNamesFromUrl(slide.dataset)).flat()
  )).filter((name) => !!name);

  /* Delete any keys from `datasets` that aren't needed for this narrative */
  for (const name of Array.from(Object.keys(datasets))) {
    if (!referencedUrlNames.includes(name)) {
      logs.push(`\tDropping dataset for ${name} as it's not referenced in the narrative`);
      delete datasets[name]
    }
  }

  const missingDatasets = referencedUrlNames.filter((name) => !datasets[name]);
  for (const name of missingDatasets) {
    logs.push(`\tNarrative references dataset for ${name} but this wasn't provided. Expect errors!`);
  }
  if (missingDatasets.length===0) {
    logs.push(`\tAll ${referencedUrlNames.length} datasets referenced are present`);
  }

  return slides;
}

function makeDroppedFile(file) {
  const filename = file.name;
  const filenameLower = filename.toLowerCase();
  let filenameBase = filenameLower;
  let type = undefined; // default state is undefined
  let sidecarPropName = undefined;
  let decompressCallback = false;

  /* Check for compression suffixes & if so store the decompression callback */
  for (const [suffix, callback] of Object.entries(COMPRESSIONS)) {
    if (filenameBase.endsWith(suffix)) {
      decompressCallback = callback;
      filenameBase = filenameBase.slice(0, filenameBase.length - suffix.length);
      break;
    }
  }

  /* check if it looks like a (main or sidecar) JSON */
  for (const suffix of JSON_SUFFIXES) {
    if (filenameBase.endsWith(suffix)) {
      filenameBase = filenameBase.slice(0, filenameBase.length - suffix.length);
      for (const sidecarSuffix of Object.keys(SIDECAR_SUFFIXES)) {
        if (filenameBase.endsWith(sidecarSuffix)) {
          sidecarPropName = SIDECAR_SUFFIXES[sidecarSuffix];
          filenameBase = filenameBase.slice(0, filenameBase.length - sidecarSuffix.length);
          break; // the inner for-loop (sidecars)
        }
      }
      type = sidecarPropName ? FILE_TYPES.SIDECAR : FILE_TYPES.MAIN;
      break;
    }
  }

  /* Check if it looks like a narrative */
  if (!type) {
    for (const suffix of NARRATIVE_SUFFIXES) {
      if (filenameBase.endsWith(suffix)) {
        type = FILE_TYPES.NARRATIVE;
        filenameBase = filenameBase.slice(0, filenameBase.length - suffix.length);
        break;
      }
    }
  }

  /* Check if it looks like a newick file */
  if (!type) {
    for (const suffix of NEWICK_SUFFIXES) {
      if (filenameBase.endsWith(suffix)) {
        type = FILE_TYPES.NEWICK;
        filenameBase = filenameBase.slice(0, filenameBase.length - suffix.length);
        break;
      }
    }
  }

  /* convert the basename (if there is one!) to nextstrain-like URL display */
  const urlName = filenameBase ? filenameBase.replaceAll("_", "/") : undefined;

  /* Finally, check if the file is handle-able by Auspice itself */
  if (!type && isAuspiceAcceptedFileType(file)) {
    type = FILE_TYPES.AUSPICE_DRAG_DROP;
  }

  /** promisify FileReader's readAsText() so we can use it within
  * async functions via `await readFile(file)`.
  * Adapted from https://stackoverflow.com/a/51026615
  */
  function readFile() {
    return new Promise((resolve, reject) => {
      const fileReader = new window.FileReader();
      fileReader.onloadend = async function(e) {
        const text = decompressCallback ?
          (await decompressCallback(file)) :
          e.target.result;
        if (type===FILE_TYPES.MAIN || type===FILE_TYPES.SIDECAR) {
          resolve(JSON.parse(text));
        } else {
          resolve(text);
        }
      };
      fileReader.onerror = function(e) {
        reject(e);
      };
      fileReader.readAsText(file);
    });
  }

  return {file, urlName, type, sidecarPropName, readFile};
}
