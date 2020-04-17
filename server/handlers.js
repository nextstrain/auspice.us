
module.exports = {
  getAvailable: send204,
  getDataset: send204,
  getNarrative: send204
};


function send204(req, res) {
  // res.statusMessage = `Auspice.us should not use the API handlers`;
  return res.status(204).end();
}