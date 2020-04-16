const getNarrative = require("./serverGetNarrative").default;
const getDataset = require("./serverGetDataset").default;
const utils = require("../node_modules/auspice/cli/utils.js"); // not great

const getAvailable = (req, res) => {
  res.statusMessage = `Auspice.us currently doesn't have a listing of available datasets.`;
  utils.warn(res.statusMessage);
  return res.status(500).end();
};

module.exports = {
  getAvailable,
  getDataset,
  getNarrative
};
