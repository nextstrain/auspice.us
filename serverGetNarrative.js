const utils = require("../cli/utils");

const getNarrative = (req, res) => {
  res.statusMessage = `Auspice.us currently doesn't serve narratives.`;
  utils.warn(res.statusMessage);
  return res.status(500).end();
};

module.exports = {
  default: getNarrative
};
