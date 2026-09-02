
function send204(req, res) {
  // res.statusMessage = `Auspice.us should not use the API handlers`;
  return res.status(204).end();
}

export const getAvailable = send204;
export const getDataset = send204;
export const getNarrative = send204;
