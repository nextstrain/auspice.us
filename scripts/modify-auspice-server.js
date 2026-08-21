/**
 * This script exists to modify settings in the auspice server which are not currently exposed
 * (i.e. not customisable). Over time I hope that use-cases here (and elsewhere) can drive
 * development of auspice such that this script becomes unnecessary!
 */

import fs from "fs";
import path from "path";

let viewSrc = fs.readFileSync(path.join(import.meta.dirname, "../node_modules/auspice/cli-build/view.js"), {encoding: "utf8"});
viewSrc = redirectHttpToHttps(viewSrc)
fs.writeFileSync(path.join(import.meta.dirname, "../node_modules/auspice/cli-build/view.js"), viewSrc, {encoding: 'utf8'})

/* ----------------------------------------------------------------------------------------- */

/**
 * The current auspice server does not perform redirection from http://domain
 * to https://domain. (Sidenote: it does (for historical reasons) include the `express-naked-redirect`
 * library which is used to redirect http[s]://www.doman -> http[s]://domain).
 * This function modifies the server to use the heroku-ssl-redirect library.
 * following what we do on nextstrain.org
 */
function redirectHttpToHttps(contents) {
  console.log("Modifying the auspice server (view.js) to redirect http -> https on heroku");
  const useCompression = "app.use(compression());";
  const fsImport = 'import fs from "fs";';
  if (contents.includes(useCompression) && contents.includes(fsImport)) {
    contents = contents.replace(fsImport, "import sslRedirect from 'heroku-ssl-redirect';" + "\n" + fsImport);
    contents = contents.replace(useCompression, "app.use(sslRedirect());" + "\n  " + useCompression);
  } else {
    console.log("WARNING -- redirect HTTP -> HTTPS failed. Has the view.js contents changed?");
  }
  return contents;
}
