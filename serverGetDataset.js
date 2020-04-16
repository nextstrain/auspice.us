const queryString = require("query-string");
const utils = require("../cli/utils");

const error = (res, clientMsg, serverMsg="") => {
  res.statusMessage = clientMsg;
  utils.warn(`${clientMsg} -- ${serverMsg}`);
  return res.status(500).end();
};

const getGithubPaths = (prefixFields) => {
  if (prefixFields.length < 3) {
    throw new Error("Community URLs must be of format community/githubOrgName/repoName/...");
  }
  const datasetFields = prefixFields.slice(2); // remove "community" and the github orgName
  const fetchUrlBase= `https://raw.githubusercontent.com/${prefixFields[1]}/${prefixFields[2]}/master/auspice/${datasetFields.join("/")}`;
  return {
    metaPath: fetchUrlBase + "_meta.json",
    treePath: fetchUrlBase + "_tree.json"
  };
};

const getDataset = async (req, res) => {
  const rawQuery = req.url.split('?')[1];
  utils.log(`Getting datasets for: ${rawQuery}`);
  const query = queryString.parse(rawQuery);
  const prefix = query.prefix
    .replace(/^\//, '')
    .replace(/\/$/, '');
  const prefixFields = prefix.split("/");

  if (prefixFields[0] === "community") {

    try {
      const {metaPath, treePath} = getGithubPaths(prefixFields);
      const rawJsons= await Promise.all([utils.fetchJSON(metaPath), utils.fetchJSON(treePath)]);
      const jsonToSend = {
        _source: "github",
        _url: prefix,
        meta: rawJsons[0],
        tree: rawJsons[1]
      };
      utils.verbose("Success fetching v1 JSONs. Sending as a single JSON.");
      res.json(jsonToSend);
    } catch (err) {
      return error(res, "Couldn't get dataset", err.message);
    }

  } else {
    return error(res, "Only community URLs currently available");
  }


};

module.exports = {
  default: getDataset
};
