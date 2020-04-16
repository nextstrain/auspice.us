const utils = require("../node_modules/auspice/cli/utils.js"); // not great

const getNarrative = (req, res) => {
  res.statusMessage = `Auspice.us currently doesn't serve narratives.`;
  utils.warn(res.statusMessage);
  return res.status(500).end();
};

module.exports = {
  default: getNarrative
};
